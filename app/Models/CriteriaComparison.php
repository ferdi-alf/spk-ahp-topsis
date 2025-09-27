<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CriteriaComparison extends Model
{
    use HasFactory;
    protected $table = 'criteria_comparisons';

    protected $fillable = ['criteria1_id', 'criteria2_id', 'value'];

    public function criteria1()
    {
        return $this->belongsTo(Criteria::class, 'criteria1_id');
    }

    public function criteria2()
    {
        return $this->belongsTo(Criteria::class, 'criteria2_id');
    }
}
