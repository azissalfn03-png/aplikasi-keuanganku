<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RabItem;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->isMethod('post') ? $this->payload($request) : $request->query();
        $action = $payload['action'] ?? ($request->isMethod('post') ? 'saveTransaksi' : 'summary');

        return match ($action) {
            'getTransaksi' => response()->json($this->transactions()),
            'editTransaksi' => $this->editTransaction($payload),
            'getRAB' => response()->json($this->rabItems()),
            'saveRAB' => $this->saveRab($payload),
            'editRAB' => $this->editRab($payload),
            'summary' => response()->json($this->summary()),
            default => $this->saveTransaction($payload),
        };
    }

    private function payload(Request $request): array
    {
        $data = $request->json()->all();
        if ($data === []) {
            $decoded = json_decode($request->getContent(), true);
            $data = is_array($decoded) ? $decoded : $request->all();
        }

        return $data;
    }

    private function saveTransaction(array $payload): JsonResponse
    {
        $validated = validator($payload, [
            'keterangan' => ['required', 'string', 'max:255'],
            'jenis' => ['required', 'in:masuk,keluar'],
            'kategori' => ['nullable', 'string', 'max:255'],
            'nominal' => ['required', 'numeric', 'min:0.01'],
        ])->validate();

        DB::transaction(function () use ($validated) {
            $nominal = (float) $validated['nominal'];
            $uangMasuk = $validated['jenis'] === 'masuk' ? $nominal : 0;
            $uangKeluar = $validated['jenis'] === 'keluar' ? $nominal : 0;
            $saldoTerakhir = (float) (Transaction::latest('id')->value('uang_sisa') ?? 0);

            Transaction::create([
                'tanggal' => now(),
                'keterangan' => $validated['keterangan'],
                'jenis' => $validated['jenis'],
                'kategori' => $validated['kategori'] ?? null,
                'nominal' => $nominal,
                'uang_masuk' => $uangMasuk,
                'uang_keluar' => $uangKeluar,
                'uang_sisa' => $saldoTerakhir + $uangMasuk - $uangKeluar,
            ]);
        });

        return response()->json(['result' => 'success', 'status' => 'success']);
    }

    private function editTransaction(array $payload): JsonResponse
    {
        $validated = validator($payload, [
            'rowNumber' => ['required', 'integer', 'min:1'],
            'keterangan' => ['required', 'string', 'max:255'],
            'jenis' => ['required', 'in:masuk,keluar'],
            'kategori' => ['nullable', 'string', 'max:255'],
            'nominal' => ['required', 'numeric', 'min:0.01'],
            'tanggal' => ['nullable', 'date'],
            'tanggalBaru' => ['nullable', 'date'],
        ])->validate();

        $transaction = Transaction::findOrFail((int) $validated['rowNumber']);
        $nominal = (float) $validated['nominal'];
        $transaction->update([
            'tanggal' => $this->dateFromPayload($validated, $transaction->tanggal),
            'keterangan' => $validated['keterangan'],
            'jenis' => $validated['jenis'],
            'kategori' => $validated['kategori'] ?? null,
            'nominal' => $nominal,
            'uang_masuk' => $validated['jenis'] === 'masuk' ? $nominal : 0,
            'uang_keluar' => $validated['jenis'] === 'keluar' ? $nominal : 0,
        ]);
        $this->recalculateBalances();

        return response()->json(['result' => 'success', 'status' => 'success']);
    }

    private function dateFromPayload(array $payload, Carbon $fallback): Carbon
    {
        $value = $payload['tanggalBaru'] ?? $payload['tanggal'] ?? null;
        return $value ? Carbon::parse($value) : $fallback;
    }

    private function recalculateBalances(): void
    {
        $saldo = 0;
        Transaction::orderBy('tanggal')->orderBy('id')->get()->each(function (Transaction $transaction) use (&$saldo) {
            $saldo += (float) $transaction->uang_masuk - (float) $transaction->uang_keluar;
            $transaction->forceFill(['uang_sisa' => $saldo])->save();
        });
    }

    private function transactions(): array
    {
        return Transaction::orderBy('tanggal')->orderBy('id')->get()->map(function (Transaction $transaction) {
            return [
                'rowNumber' => $transaction->id,
                'tanggal' => optional($transaction->tanggal)->toDateTimeString(),
                'keterangan' => $transaction->keterangan,
                'jenis' => $transaction->jenis,
                'kategori' => $transaction->kategori,
                'nominal' => (float) $transaction->nominal,
                'uang_masuk' => (float) $transaction->uang_masuk,
                'uang_keluar' => (float) $transaction->uang_keluar,
                'uang_sisa' => (float) $transaction->uang_sisa,
            ];
        })->all();
    }

    private function summary(): array
    {
        $pemasukan = (float) Transaction::sum('uang_masuk');
        $pengeluaran = (float) Transaction::sum('uang_keluar');

        return [
            'pemasukan' => $pemasukan,
            'pengeluaran' => $pengeluaran,
            'sisa' => $pemasukan - $pengeluaran,
        ];
    }

    private function rabItems(): array
    {
        return RabItem::orderBy('id')->get()->map(fn (RabItem $item) => [
            'rowNumber' => $item->id,
            'kategori' => $item->kategori,
            'item' => $item->item,
            'qty' => $item->qty,
            'harga_satuan' => (float) $item->harga_satuan,
            'nominal' => (float) $item->nominal,
        ])->all();
    }

    private function saveRab(array $payload): JsonResponse
    {
        $validated = $this->validateRab($payload);
        RabItem::create($validated);

        return response()->json(['result' => 'success', 'status' => 'success']);
    }

    private function editRab(array $payload): JsonResponse
    {
        $validated = validator($payload, ['rowNumber' => ['required', 'integer', 'min:1']])->validate();
        $rab = RabItem::findOrFail((int) $validated['rowNumber']);
        $rab->update($this->validateRab($payload));

        return response()->json(['result' => 'success', 'status' => 'success']);
    }

    private function validateRab(array $payload): array
    {
        $validated = validator($payload, [
            'kategori' => ['required', 'string', 'max:255'],
            'item' => ['required', 'string', 'max:255'],
            'qty' => ['required', 'integer', 'min:1'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
            'nominal' => ['nullable', 'numeric', 'min:0'],
        ])->validate();

        $validated['nominal'] = $validated['nominal'] ?? ((int) $validated['qty'] * (float) $validated['harga_satuan']);
        return $validated;
    }
}
