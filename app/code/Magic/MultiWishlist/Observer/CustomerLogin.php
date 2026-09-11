<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Observer;

use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Math\Random;
use Magic\MultiWishlist\Model\WishlistFactory;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist\Collection as WishlistCollection;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist\CollectionFactory as WishlistCollectionFactory;

class CustomerLogin implements ObserverInterface
{
    public function __construct(
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistCollectionFactory $collectionFactory,
        private readonly Random $mathRandom
    ) {}

    public function execute(Observer $observer): void
    {
        $customer = $observer->getEvent()->getCustomer();
        if (!$customer || !$customer->getId()) {
            return;
        }

        $customerId = (int) $customer->getId();

        /** @var WishlistCollection $collection */
        $collection = $this->collectionFactory->create();
        $collection->addFieldToFilter('customer_id', $customerId)
                   ->addFieldToFilter('is_default', 1)
                   ->setPageSize(1);

        if ($collection->getSize() === 0) {
            $wishlist = $this->wishlistFactory->create();
            $wishlist->setCustomerId($customerId);
            $wishlist->setWishlistName('My Wishlist');
            $wishlist->setIsDefault(1);
            $wishlist->setShared(0);
            $wishlist->setSharingCode($this->mathRandom->getUniqueHash());
            $wishlist->save();
        }
    }
}
