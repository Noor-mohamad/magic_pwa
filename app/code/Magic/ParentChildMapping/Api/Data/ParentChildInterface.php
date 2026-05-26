<?php
namespace Magic\ParentChildMapping\Api\Data;

interface ParentChildInterface
{
    const TABLE_NAME         = 'childsku_mapping';
    const ID                 = 'id';
    const PARENT_SKU         = 'parent_sku';
    const CHILD_SKU          = 'child_sku';
    const SPECIAL_PRICE      = 'special_price';
    const FROM_DATE          = 'from_date';
    const TO_DATE            = 'to_date';
    const UPDATE_PRICE_FLAG  = 'update_price_flag';
    const FLAG_SPECIAL_PRICE = 'flag_special_price';
    const FLAG_FROM_DATE     = 'flag_from_date';
    const FLAG_TO_DATE       = 'flag_to_date';
    const CREATED_AT         = 'created_at';
    const UPDATED_AT         = 'updated_at';

    /**
     * @return mixed
     */
    public function getId();

    /**
     * @param $id
     * @return mixed Sets the identifier.
     */
    public function setId($id);
    public function getParentSku();
    public function setParentSku($parentSku);
    public function getChildSku();
    public function setChildSku($childSku);
    public function getSpecialPrice();
    public function setSpecialPrice($specialPrice);
    public function getFromDate();
    public function setFromDate($fromDate);
    public function getToDate();
    public function setToDate($toDate);
    public function getUpdatePriceFlag();
    public function setUpdatePriceFlag($flag);
    public function getCreatedAt();
    public function getUpdatedAt();
}
