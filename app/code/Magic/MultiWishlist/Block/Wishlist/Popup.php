<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Block\Wishlist;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\Serialize\Serializer\Json as JsonSerializer;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist\CollectionFactory as WishlistCollectionFactory;

class Popup extends Template
{
    protected $_template = 'Magic_MultiWishlist::wishlist/popup.phtml';

    public function __construct(
        Context $context,
        private readonly CustomerSession $customerSession,
        private readonly WishlistCollectionFactory $wishlistCollectionFactory,
        private readonly JsonSerializer $json,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function isLoggedIn(): bool
    {
        return $this->customerSession->isLoggedIn();
    }

    public function getWishlistsJson(): string
    {
        if (!$this->customerSession->isLoggedIn()) {
            return '[]';
        }

        $collection = $this->wishlistCollectionFactory->create()
            ->addFieldToFilter('customer_id', $this->customerSession->getCustomerId())
            ->setOrder('is_default', 'DESC')
            ->setOrder('created_at', 'ASC');

        $data = [];
        foreach ($collection as $wishlist) {
            $data[] = [
                'wishlist_id'   => (int) $wishlist->getId(),
                'wishlist_name' => $wishlist->getWishlistName(),
                'is_default'    => (int) $wishlist->getIsDefault(),
            ];
        }

        return $this->json->serialize($data);
    }

    public function getAddItemUrl(): string
    {
        return $this->getUrl('multiwishlist/index/additem');
    }

    public function getCreateUrl(): string
    {
        return $this->getUrl('multiwishlist/index/create');
    }

    public function getSearchUrl(): string
    {
        return $this->getUrl('multiwishlist/index/search');
    }
}
