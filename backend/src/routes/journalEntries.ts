import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listJournalEntries, getJournalEntry, createJournalEntry, postJournalEntry } from '../controllers/journalEntryController';

const router = Router();

router.use(authenticate);

router.get('/', authorizeResource('journalEntry', 'read'), listJournalEntries);
router.get('/:id', authorizeResource('journalEntry', 'read'), getJournalEntry);
router.post('/', authorizeResource('journalEntry', 'create'), createJournalEntry);
router.post('/:id/post', authorizeResource('journalEntry', 'post'), postJournalEntry);

export default router;
