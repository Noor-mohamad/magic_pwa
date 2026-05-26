<?php

namespace Indglobal\SilentOffer\Ui\Component\Listing\Column;

use Magento\Framework\View\Element\UiComponent\ContextInterface;
use Magento\Framework\View\Element\UiComponentFactory;
use Magento\Ui\Component\Listing\Columns\Column;
use Magento\Framework\UrlInterface;

/**
 * Class DataActions
 * @package Indglobal\SilentOffer\Ui\Component\Listing\Column
 */
class DataActions extends Column
{
    const URL_PATH_EDIT = 'silentoffer/index/edit';
    const URL_PATH_DELETE = 'silentoffer/index/delete';
    const URL_PATH_PROCESS = 'silentoffer/index/process';

    /**
     * URL builder
     *
     * @var \Magento\Framework\UrlInterface
     */
    protected $urlBuilder;

    /**
     * @param ContextInterface $context
     * @param UiComponentFactory $uiComponentFactory
     * @param UrlInterface $urlBuilder
     * @param array $components
     * @param array $data
     */
    public function __construct(
        ContextInterface $context,
        UiComponentFactory $uiComponentFactory,
        UrlInterface $urlBuilder,
        array $components = [],
        array $data = []
    ) {
        $this->urlBuilder = $urlBuilder;
        parent::__construct($context, $uiComponentFactory, $components, $data);
    }

    /**
     * Prepare Data Source
     *
     * @param array $dataSource
     * @return array
     */
    public function prepareDataSource(array $dataSource)
    {
        if (isset($dataSource['data']['items'])) {
            foreach ($dataSource['data']['items'] as & $item) {
                if (isset($item['entity_id'])) {
                    $item[$this->getData('name')] = [
                        'edit' => [
                            'href' => $this->urlBuilder->getUrl(
                                static::URL_PATH_EDIT,
                                [
                                    'id' => $item['entity_id']
                                ]
                            ),
                            'label' => __('Edit')
                        ],
                        'delete' => [
                            'href' => $this->urlBuilder->getUrl(
                                static::URL_PATH_DELETE,
                                [
                                    'id' => $item['entity_id']
                                ]
                            ),
                            'label' => __('Delete'),
                            'confirm' => [
                                'title' => __('Delete'),
                                'message' => __('Are you sure you want to delete?')
                            ]
                        ],
                        'process' => [
                            'href' => $this->urlBuilder->getUrl(
                                static::URL_PATH_PROCESS,
                                [
                                    'id' => $item['entity_id']
                                ]
                            ),
                            'label' => __('Process'),
                            'confirm' => [
                                'title' => __('Alert'),
                                'message' => __('Are you sure you want to remove all offer right now"?')
                            ]
                        ]
                    ];
                }
            }
        }
        return $dataSource;
    }
}
