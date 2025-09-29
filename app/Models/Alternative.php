<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Alternative extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'upload_id'];

    public function scores()
    {
        return $this->hasMany(AlternativeValue::class);
    }

    // Tambahkan relasi ke Upload
    public function upload()
    {
        return $this->belongsTo(Upload::class);
    }
}