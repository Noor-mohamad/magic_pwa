<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Block\Wishlist;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Helper\Image as ImageHelper;
use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Pricing\Helper\Data as PriceHelper;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magic\MultiWishlist\Model\Wishlist;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist\CollectionFactory as WishlistCollectionFactory;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem\CollectionFactory as ItemCollectionFactory;
use Magic\MultiWishlist\Model\WishlistFactory;

class View extends Template
{
    protected $_template = 'Magic_MultiWishlist::wishlist/view.phtml';

    private ?Wishlist $wishlist = null;

    public function __construct(
        Context $context,
        private readonly CustomerSession $customerSession,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly WishlistCollectionFactory $wishlistCollectionFactory,
        private readonly ItemCollectionFactory $itemCollectionFactory,
        private readonly ProductRepositoryInterface $productRepository,
        private readonly ImageHelper $imageHelper,
        private readonly PriceHelper $priceHelper,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function getWishlist(): ?Wishlist
    {
        if ($this->wishlist === null) {
            $wishlistId = (int) $this->getRequest()->getParam('wishlist_id');
            $wishlist   = $this->wishlistFactory->create();
            $this->wishlistResource->load($wishlist, $wishlistId);
            if ($wishlist->getId() && $wishlist->getCustomerId() === (int) $this->customerSession->getCustomerId()) {
                $this->wishlist = $wishlist;
            }
        }
        return $this->wishlist;
    }

    public function getItems(): array
    {
        $wishlist = $this->getWishlist();
        if (!$wishlist) {
            return [];
        }

        $rows       = [];
        $collection = $this->itemCollectionFactory->create()
            ->addFieldToFilter('wishlist_id', $wishlist->getId());

        foreach ($collection as $item) {
            try {
                $product = $this->productRepository->getById($item->getProductId());
                $rows[]  = [
                    'item'    => $item,
                    'product' => $product,
                    'image'   => $this->imageHelper->init($product, 'product_thumbnail_image')->getUrl(),
                    'price'   => $this->priceHelper->currency($product->getFinalPrice(), true, false),
                ];
            } catch (NoSuchEntityException) {
                // Product was deleted — skip
            }
        }

        return $rows;
    }

    /** All customer wishlists except the current one (for move/copy dropdowns). */
    public function getOtherWishlists(): array
    {
        $wishlist = $this->getWishlist();
        if (!$wishlist) {
            return [];
        }

        $collection = $this->wishlistCollectionFactory->create()
            ->addFieldToFilter('customer_id', $this->customerSession->getCustomerId())
            ->addFieldToFilter('wishlist_id', ['neq' => $wishlist->getId()])
            ->setOrder('is_default', 'DESC')
            ->setOrder('wishlist_name', 'ASC');

        return $collection->getItems();
    }

    public function getRemoveItemUrl(int $itemId): string
    {
        return $this->getUrl('multiwishlist/index/removeitem', ['item_id' => $itemId]);
    }

    public function getAddToCartUrl(int $itemId): string
    {
        return $this->getUrl('multiwishlist/index/addtocart', ['item_id' => $itemId]);
    }

    public function getAddAllToCartUrl(): string
    {
        $wishlist = $this->getWishlist();
        return $this->getUrl('multiwishlist/index/addalltocart', [
            'wishlist_id' => $wishlist ? $wishlist->getId() : 0,
        ]);
    }

    public function getMoveItemBaseUrl(): string
    {
        return $this->getUrl('multiwishlist/index/moveitem');
    }

    public function getCopyItemBaseUrl(): string
    {
        return $this->getUrl('multiwishlist/index/copyitem');
    }

    public function getMoveAllUrl(): string
    {
        return $this->getUrl('multiwishlist/index/moveall');
    }

    public function getCopyAllUrl(): string
    {
        return $this->getUrl('multiwishlist/index/copyall');
    }

    public function getUpdateItemBaseUrl(): string
    {
        return $this->getUrl('multiwishlist/index/updateitem');
    }

    public function getShareUrl(): string
    {
        $wishlist = $this->getWishlist();
        return $this->getUrl('multiwishlist/index/share', [
            'wishlist_id' => $wishlist ? $wishlist->getId() : 0,
        ]);
    }

    public function getBackUrl(): string
    {
        return $this->getUrl('multiwishlist');
    }
}
