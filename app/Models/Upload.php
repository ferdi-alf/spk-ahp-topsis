<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Upload extends Model
{
    protected $table = 'uploads';

    protected $fillable = [
        'filename',
    ];

    public function alternatives()
    {
        return $this->hasMany(Alternative::class);
    }

    public function results()
    {
        return $this->hasMany(Result::class);
    }
}
