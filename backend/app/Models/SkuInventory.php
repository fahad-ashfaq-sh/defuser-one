<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SkuInventory extends Model
{
    protected $table = 'sku_inventories';

    protected $fillable = [
        'sku_code',
        'name',
        'category_slug',
        'base_price',
        'applied_tax_rate',
        'margin_status',
    ];

    protected $casts = [
        'base_price'       => 'decimal:4',
        'applied_tax_rate' => 'decimal:4',
    ];

    public $timestamps = true;
}