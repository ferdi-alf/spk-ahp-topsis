<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Alternative extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function scores()
    {
        return $this->hasMany(AlternativeValue::class);
    }
}
