import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listContacts, getContact, createContact, updateContact, deleteContact } from '../controllers/contactController';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { listAnalytics, getAnalytical, createAnalytical, updateAnalytical, deleteAnalytical } from '../controllers/analyticalController';
import { listCOA, getCOA, createCOA, updateCOA, deleteCOA } from '../controllers/coaController';
import { listJournals, getJournal, createJournal, updateJournal, deleteJournal } from '../controllers/journalController';
import { listUsers, getUser, updateUser, deleteUser } from '../controllers/userController';

const router = Router();

router.use(authenticate);

// Contacts
router.get('/contacts', authorizeResource('contact', 'read'), listContacts);
router.get('/contacts/:id', authorizeResource('contact', 'read'), getContact);
router.post('/contacts', authorizeResource('contact', 'create'), createContact);
router.put('/contacts/:id', authorizeResource('contact', 'update'), updateContact);
router.delete('/contacts/:id', authorizeResource('contact', 'delete'), deleteContact);

// Products
router.get('/products', authorizeResource('product', 'read'), listProducts);
router.get('/products/:id', authorizeResource('product', 'read'), getProduct);
router.post('/products', authorizeResource('product', 'create'), createProduct);
router.put('/products/:id', authorizeResource('product', 'update'), updateProduct);
router.delete('/products/:id', authorizeResource('product', 'delete'), deleteProduct);

// Categories
router.get('/categories', authorizeResource('category', 'read'), listCategories);
router.get('/categories/:id', authorizeResource('category', 'read'), getCategory);
router.post('/categories', authorizeResource('category', 'create'), createCategory);
router.put('/categories/:id', authorizeResource('category', 'update'), updateCategory);
router.delete('/categories/:id', authorizeResource('category', 'delete'), deleteCategory);

// Analyticals
router.get('/analytics', authorizeResource('analytical', 'read'), listAnalytics);
router.get('/analytics/:id', authorizeResource('analytical', 'read'), getAnalytical);
router.post('/analytics', authorizeResource('analytical', 'create'), createAnalytical);
router.put('/analytics/:id', authorizeResource('analytical', 'update'), updateAnalytical);
router.delete('/analytics/:id', authorizeResource('analytical', 'delete'), deleteAnalytical);

// Chart of Accounts
router.get('/chart-of-accounts', authorizeResource('coa', 'read'), listCOA);
router.get('/chart-of-accounts/:id', authorizeResource('coa', 'read'), getCOA);
router.post('/chart-of-accounts', authorizeResource('coa', 'create'), createCOA);
router.put('/chart-of-accounts/:id', authorizeResource('coa', 'update'), updateCOA);
router.delete('/chart-of-accounts/:id', authorizeResource('coa', 'delete'), deleteCOA);

// Journals
router.get('/journals', authorizeResource('journal', 'read'), listJournals);
router.get('/journals/:id', authorizeResource('journal', 'read'), getJournal);
router.post('/journals', authorizeResource('journal', 'create'), createJournal);
router.put('/journals/:id', authorizeResource('journal', 'update'), updateJournal);
router.delete('/journals/:id', authorizeResource('journal', 'delete'), deleteJournal);

// Users
router.get('/users', authorizeResource('user', 'read'), listUsers);
router.get('/users/:id', authorizeResource('user', 'read'), getUser);
router.put('/users/:id', authorizeResource('user', 'update'), updateUser);
router.delete('/users/:id', authorizeResource('user', 'delete'), deleteUser);

export default router;
