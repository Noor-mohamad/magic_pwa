<?php

namespace Indglobal\SilentOffer\Api\Data;

use Magento\Framework\Api\SearchResultsInterface;

/**
 * Interface SilentOfferSkuSearchResultsInterface
 * @package Indglobal\SilentOffer\Api\Data
 */
interface SilentOfferSkuSearchResultsInterface extends SearchResultsInterface
{
    /**
     * Get data list.
     *
     * @return SilentOfferSkuInterface[]
     */
    public function getItems();

    /**
     * Set data list.
     *
     * @param SilentOfferSkuInterface[] $items
     * @return $this
     */
    public function setItems(array $items);
}
