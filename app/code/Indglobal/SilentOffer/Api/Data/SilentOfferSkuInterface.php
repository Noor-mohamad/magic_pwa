<?php

namespace Indglobal\SilentOffer\Api\Data;

interface SilentOfferSkuInterface
{
    /** Table Name */
    const TABLE_NAME = "silent_offer_skus";

    /** Table fields */
    const ENTITY_ID = 'entity_id';
    const BRAND_TITLE = 'brand_title';
    const SKU = 'sku';
    const DATE_FROM = 'date_from';
    const DATE_TO = 'date_to';
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    /**
     * Get Entity ID.
     *
     * @return int|null
     */
    public function getEntityId();

    /**
     * Set Entity ID.
     *
     * @param int $entityId
     * @return $this
     */
    public function setEntityId($entityId);

    /**
     * Get Brand Title.
     *
     * @return string|null
     */
    public function getBrandTitle();

    /**
     * Set Brand Title.
     *
     * @param string $brandTitle
     * @return $this
     */
    public function setBrandTitle($brandTitle);

    /**
     * Get SKU.
     *
     * @return string|null
     */
    public function getSku();

    /**
     * Set SKU.
     *
     * @param string $sku
     * @return $this
     */
    public function setSku($sku);

    /**
     * Get Date From.
     *
     * @return string|null
     */
    public function getDateFrom();

    /**
     * Set Date From.
     *
     * @param string $dateFrom
     * @return $this
     */
    public function setDateFrom($dateFrom);

    /**
     * Get Date To.
     *
     * @return string|null
     */
    public function getDateTo();

    /**
     * Set Date To.
     *
     * @param string $dateTo
     * @return $this
     */
    public function setDateTo($dateTo);

    /**
     * Get Created At.
     *
     * @return string|null
     */
    public function getCreatedAt();

    /**
     * Set Created At.
     *
     * @param string $createdAt
     * @return $this
     */
    public function setCreatedAt($createdAt);

    /**
     * Get Updated At.
     *
     * @return string|null
     */
    public function getUpdatedAt();

    /**
     * Set Updated At.
     *
     * @param string $updatedAt
     * @return $this
     */
    public function setUpdatedAt($updatedAt);
}
