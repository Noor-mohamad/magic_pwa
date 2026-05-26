<?php

namespace Indglobal\SilentOffer\Controller\Adminhtml\Index;

use Indglobal\SilentOffer\Model\SilentOfferSku;

/**
 * Class MassDelete
 * @package Indglobal\SilentOffer\Controller\Adminhtml\Index
 */
class MassDelete extends MassAction
{
    /**
     * Mass action
     *
     * @param SilentOfferSku $data
     * @return $this
     */
    protected function massAction(SilentOfferSku $data)
    {
        $this->dataRepository->delete($data);
        return $this;
    }
}
