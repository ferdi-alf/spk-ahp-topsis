<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlternativeValue extends Model
{
    protected $table = 'alternative_values';

    protected $fillable = [
        'alternative_id',
        'criteria_id',
        'value',
    ];

    public function alternative()
    {
        return $this->belongsTo(Alternative::class);
    }

    public function criteria()
    {
        return $this->belongsTo(Criteria::class);
    }
}

