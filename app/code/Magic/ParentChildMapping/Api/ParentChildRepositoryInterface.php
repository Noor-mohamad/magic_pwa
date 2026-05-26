<?php
namespace Magic\ParentChildMapping\Api;

use Magic\ParentChildMapping\Api\Data\ParentChildInterface;

interface ParentChildRepositoryInterface
{
    public function save(ParentChildInterface $record);
    public function getById($id);
    public function delete(ParentChildInterface $record);
    public function deleteById($id);
}
