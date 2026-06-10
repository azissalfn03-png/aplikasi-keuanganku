<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RabItem extends Model
{
    protected $fillable = [
        'kategori',
        'item',
        'qty',
        'harga_satuan',
        'nominal',
    ];

    protected $casts = [
        'qty' => 'integer',
        'harga_satuan' => 'decimal:2',
        'nominal' => 'decimal:2',
    ];
}
