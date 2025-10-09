<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CriteriaComparison extends Model
{
    use HasFactory;
    
    protected $table = 'criteria_comparisons';

    protected $fillable = [
        'criteria1_id',
        'criteria2_id',
        'value',
        'favored_criteria'  
    ];

    // buat method terpisah untuk mendapatkan raw value
    public function getRawValue()
    {
        return (float) $this->getAttributes()['value'];
    }

    // Atau buat accessor dengan nama berbeda untuk display
    public function getFormattedValueAttribute()
    {
        return round((float) $this->attributes['value'], 3);
    }

    public function criteria1()
    {
        return $this->belongsTo(Criteria::class, 'criteria1_id');
    }

    public function criteria2()
    {
        return $this->belongsTo(Criteria::class, 'criteria2_id');
    }
}