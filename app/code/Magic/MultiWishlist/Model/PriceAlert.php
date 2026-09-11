<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Model;

use Magento\Framework\Model\AbstractModel;
use Magic\MultiWishlist\Model\ResourceModel\PriceAlert as PriceAlertResource;

class PriceAlert extends AbstractModel
{
    protected function _construct(): void
    {
        $this->_init(PriceAlertResource::class);
    }

    public function getCustomerId(): int
    {
        return (int) $this->getData('customer_id');
    }

    public function setCustomerId(int $customerId): self
    {
        return $this->setData('customer_id', $customerId);
    }

    public function getProductId(): int
    {
        return (int) $this->getData('product_id');
    }

    public function setProductId(int $productId): self
    {
        return $this->setData('product_id', $productId);
    }

    public function getWishlistId(): int
    {
        return (int) $this->getData('wishlist_id');
    }

    public function setWishlistId(int $wishlistId): self
    {
        return $this->setData('wishlist_id', $wishlistId);
    }

    public function getPriceAtAdd(): float
    {
        return (float) $this->getData('price_at_add');
    }

    public function setPriceAtAdd(float $price): self
    {
        return $this->setData('price_at_add', $price);
    }

    public function getIsActive(): int
    {
        return (int) $this->getData('is_active');
    }

    public function setIsActive(int $flag): self
    {
        return $this->setData('is_active', $flag);
    }

    public function getLastSentAt(): ?string
    {
        return $this->getData('last_sent_at');
    }

    public function setLastSentAt(string $datetime): self
    {
        return $this->setData('last_sent_at', $datetime);
    }
}
