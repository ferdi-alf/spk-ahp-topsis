<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Criteria extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'weight'];

    public function comparisonsAsFirst()
    {
        return $this->hasMany(CriteriaComparison::class, 'criteria1_id');
    }

    public function comparisonsAsSecond()
    {
        return $this->hasMany(CriteriaComparison::class, 'criteria2_id');
    }

    public function scores()
    {
        return $this->hasMany(AlternativeValue::class);
    }
}
