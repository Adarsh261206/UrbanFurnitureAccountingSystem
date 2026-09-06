import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listCreditNotes, getCreditNote, createCreditNote, updateCreditNote, deleteCreditNote, confirmCreditNote, cancelCreditNote } from '../controllers/creditNoteController';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('creditNote', 'read'), listCreditNotes);
router.get('/:id', authorizeResource('creditNote', 'read'), getCreditNote);
router.post('/', authorizeResource('creditNote', 'create'), createCreditNote);
router.put('/:id', authorizeResource('creditNote', 'update'), updateCreditNote);
router.delete('/:id', authorizeResource('creditNote', 'delete'), deleteCreditNote);
router.post('/:id/confirm', authorizeResource('creditNote', 'confirm'), confirmCreditNote);
router.post('/:id/cancel', authorizeResource('creditNote', 'cancel'), cancelCreditNote);

export default router;
