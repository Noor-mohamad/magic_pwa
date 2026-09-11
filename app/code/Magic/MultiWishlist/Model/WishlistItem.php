<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Model;

use Magento\Framework\Model\AbstractModel;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem as WishlistItemResource;

class WishlistItem extends AbstractModel
{
    protected function _construct(): void
    {
        $this->_init(WishlistItemResource::class);
    }

    public function getWishlistId(): int
    {
        return (int) $this->getData('wishlist_id');
    }

    public function setWishlistId(int $wishlistId): self
    {
        return $this->setData('wishlist_id', $wishlistId);
    }

    public function getProductId(): int
    {
        return (int) $this->getData('product_id');
    }

    public function setProductId(int $productId): self
    {
        return $this->setData('product_id', $productId);
    }

    public function getStoreId(): ?int
    {
        $v = $this->getData('store_id');
        return $v !== null ? (int) $v : null;
    }

    public function setStoreId(int $storeId): self
    {
        return $this->setData('store_id', $storeId);
    }

    public function getQty(): float
    {
        return (float) $this->getData('qty');
    }

    public function setQty(float $qty): self
    {
        return $this->setData('qty', $qty);
    }

    public function getComment(): ?string
    {
        return $this->getData('comment');
    }

    public function setComment(?string $comment): self
    {
        return $this->setData('comment', $comment);
    }
}
