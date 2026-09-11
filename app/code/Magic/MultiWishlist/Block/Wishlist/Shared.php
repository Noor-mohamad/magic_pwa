<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Block\Wishlist;

use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Helper\Image as ImageHelper;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Pricing\Helper\Data as PriceHelper;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magic\MultiWishlist\Model\Wishlist as WishlistModel;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist\CollectionFactory as WishlistCollectionFactory;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem\CollectionFactory as ItemCollectionFactory;

class Shared extends Template
{
    protected $_template = 'Magic_MultiWishlist::wishlist/shared.phtml';

    private ?WishlistModel $wishlist = null;

    public function __construct(
        Context $context,
        private readonly WishlistCollectionFactory $wishlistCollectionFactory,
        private readonly ItemCollectionFactory $itemCollectionFactory,
        private readonly ProductRepositoryInterface $productRepository,
        private readonly ImageHelper $imageHelper,
        private readonly PriceHelper $priceHelper,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function getWishlist(): ?WishlistModel
    {
        if ($this->wishlist === null) {
            $code       = trim((string) $this->getRequest()->getParam('code'));
            $collection = $this->wishlistCollectionFactory->create()
                ->addFieldToFilter('sharing_code', $code)
                ->addFieldToFilter('shared', 1)
                ->setPageSize(1);
            $wishlist = $collection->getFirstItem();
            if ($wishlist->getId()) {
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
                    'product' => $product,
                    'image'   => $this->imageHelper->init($product, 'product_thumbnail_image')->getUrl(),
                    'price'   => $this->priceHelper->currency($product->getFinalPrice(), true, false),
                    'qty'     => (float) ($item->getQty() ?: 1),
                    'comment' => (string) $item->getComment(),
                ];
            } catch (NoSuchEntityException) {
                // Product removed — skip
            }
        }

        return $rows;
    }
}
