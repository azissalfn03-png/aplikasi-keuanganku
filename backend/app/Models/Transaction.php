<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'tanggal',
        'keterangan',
        'jenis',
        'kategori',
        'nominal',
        'uang_masuk',
        'uang_keluar',
        'uang_sisa',
    ];

    protected $casts = [
        'tanggal' => 'datetime',
        'nominal' => 'decimal:2',
        'uang_masuk' => 'decimal:2',
        'uang_keluar' => 'decimal:2',
        'uang_sisa' => 'decimal:2',
    ];
}
