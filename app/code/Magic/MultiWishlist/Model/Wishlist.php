<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Model;

use Magento\Framework\Model\AbstractModel;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;

class Wishlist extends AbstractModel
{
    protected function _construct(): void
    {
        $this->_init(WishlistResource::class);
    }

    public function getCustomerId(): int
    {
        return (int) $this->getData('customer_id');
    }

    public function setCustomerId(int $customerId): self
    {
        return $this->setData('customer_id', $customerId);
    }

    public function getWishlistName(): string
    {
        return (string) $this->getData('wishlist_name');
    }

    public function setWishlistName(string $name): self
    {
        return $this->setData('wishlist_name', $name);
    }

    public function getIsDefault(): int
    {
        return (int) $this->getData('is_default');
    }

    public function setIsDefault(int $flag): self
    {
        return $this->setData('is_default', $flag);
    }

    public function getShared(): int
    {
        return (int) $this->getData('shared');
    }

    public function setShared(int $shared): self
    {
        return $this->setData('shared', $shared);
    }

    public function getSharingCode(): ?string
    {
        return $this->getData('sharing_code');
    }

    public function setSharingCode(string $code): self
    {
        return $this->setData('sharing_code', $code);
    }
}
