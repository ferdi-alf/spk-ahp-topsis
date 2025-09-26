<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Result extends Model
{
    protected $table = 'results';

    protected $fillable = [
        'upload_id',
        'alternative_id',
        'ahp_score',
        'ahp_rank',
        'topsis_score',
        'topsis_rank',
        'topsis_ahp_score',
        'topsis_ahp_rank',
    ];

    public function upload()
    {
        return $this->belongsTo(Upload::class);
    }

    public function alternative()
    {
        return $this->belongsTo(Alternative::class);
    }
}
