<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Controller\Index;

use Magento\Catalog\Helper\Image as ImageHelper;
use Magento\Catalog\Model\ResourceModel\Product\CollectionFactory as ProductCollectionFactory;
use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\App\Action\Context;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Pricing\Helper\Data as PriceHelper;

class Search extends AbstractAction
{
    public function __construct(
        Context $context,
        CustomerSession $customerSession,
        private readonly ProductCollectionFactory $productCollectionFactory,
        private readonly ImageHelper $imageHelper,
        private readonly PriceHelper $priceHelper,
        private readonly JsonFactory $jsonFactory
    ) {
        parent::__construct($context, $customerSession);
    }

    public function execute(): Json
    {
        $query = trim((string) $this->getRequest()->getParam('q'));

        if (mb_strlen($query) < 2) {
            return $this->jsonFactory->create()->setData(['success' => true, 'items' => []]);
        }

        $like   = '%' . addcslashes($query, '%_') . '%';
        $collection = $this->productCollectionFactory->create()
            ->addAttributeToSelect(['name', 'sku', 'thumbnail', 'price', 'final_price'])
            ->addAttributeToFilter(
                [
                    ['attribute' => 'name', 'like' => $like],
                    ['attribute' => 'sku',  'like' => $like],
                ]
            )
            ->addAttributeToFilter('status', \Magento\Catalog\Model\Product\Attribute\Source\Status::STATUS_ENABLED)
            ->addAttributeToFilter('visibility', ['in' => [
                \Magento\Catalog\Model\Product\Visibility::VISIBILITY_IN_CATALOG,
                \Magento\Catalog\Model\Product\Visibility::VISIBILITY_BOTH,
            ]])
            ->setPageSize(10);

        $items = [];
        foreach ($collection as $product) {
            $items[] = [
                'product_id' => (int) $product->getId(),
                'name'       => $product->getName(),
                'sku'        => $product->getSku(),
                'image'      => $this->imageHelper->init($product, 'product_thumbnail_image')->getUrl(),
                'price'      => $this->priceHelper->currency($product->getFinalPrice(), true, false),
            ];
        }

        return $this->jsonFactory->create()->setData(['success' => true, 'items' => $items]);
    }
}
