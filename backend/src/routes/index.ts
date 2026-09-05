import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorizeResource } from '../middleware/rbac';
import { listContacts, getContact, createContact, updateContact, deleteContact } from '../controllers/contactController';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct, bulkDeleteProducts, bulkToggleProducts, addProductImage, removeProductImage } from '../controllers/productController';
import { listBrands, getBrand, createBrand, updateBrand, deleteBrand } from '../controllers/brandController';
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController';
import { listAnalytics, getAnalytical, createAnalytical, updateAnalytical, deleteAnalytical } from '../controllers/analyticalController';
import { listCOA, getCOA, createCOA, updateCOA, deleteCOA } from '../controllers/coaController';
import { listJournals, getJournal, createJournal, updateJournal, deleteJournal } from '../controllers/journalController';
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController';
import { contactCreateValidation, contactUpdateValidation } from '../validators/masterValidators';
import { productCreateValidation, productUpdateValidation } from '../validators/masterValidators';
import { brandCreateValidation, brandUpdateValidation } from '../validators/masterValidators';
import { categoryCreateValidation, categoryUpdateValidation } from '../validators/masterValidators';
import { analyticalCreateValidation, analyticalUpdateValidation } from '../validators/masterValidators';
import { coaCreateValidation, coaUpdateValidation } from '../validators/masterValidators';
import { journalCreateValidation, journalUpdateValidation } from '../validators/masterValidators';
import { userCreateValidation, userUpdateValidation } from '../validators/masterValidators';

const router = Router();

router.use(authenticate);

router.get('/contacts', authorizeResource('contact', 'read'), listContacts);
router.get('/contacts/:id', authorizeResource('contact', 'read'), getContact);
router.post('/contacts', authorizeResource('contact', 'create'), contactCreateValidation, createContact);
router.put('/contacts/:id', authorizeResource('contact', 'update'), contactUpdateValidation, updateContact);
router.delete('/contacts/:id', authorizeResource('contact', 'delete'), deleteContact);

router.get('/products', authorizeResource('product', 'read'), listProducts);
router.get('/products/:id', authorizeResource('product', 'read'), getProduct);
router.post('/products', authorizeResource('product', 'create'), productCreateValidation, createProduct);
router.put('/products/:id', authorizeResource('product', 'update'), productUpdateValidation, updateProduct);
router.delete('/products/:id', authorizeResource('product', 'delete'), deleteProduct);
router.post('/products/bulk/delete', authorizeResource('product', 'delete'), bulkDeleteProducts);
router.post('/products/bulk/toggle', authorizeResource('product', 'update'), bulkToggleProducts);
router.post('/products/:id/images', authorizeResource('product', 'update'), addProductImage);
router.delete('/products/:id/images/:imageId', authorizeResource('product', 'update'), removeProductImage);

router.get('/brands', authorizeResource('product', 'read'), listBrands);
router.get('/brands/:id', authorizeResource('product', 'read'), getBrand);
router.post('/brands', authorizeResource('product', 'create'), brandCreateValidation, createBrand);
router.put('/brands/:id', authorizeResource('product', 'update'), brandUpdateValidation, updateBrand);
router.delete('/brands/:id', authorizeResource('product', 'delete'), deleteBrand);

router.get('/categories', authorizeResource('category', 'read'), listCategories);
router.get('/categories/:id', authorizeResource('category', 'read'), getCategory);
router.post('/categories', authorizeResource('category', 'create'), categoryCreateValidation, createCategory);
router.put('/categories/:id', authorizeResource('category', 'update'), categoryUpdateValidation, updateCategory);
router.delete('/categories/:id', authorizeResource('category', 'delete'), deleteCategory);

router.get('/analyticals', authorizeResource('analytical', 'read'), listAnalytics);
router.get('/analyticals/:id', authorizeResource('analytical', 'read'), getAnalytical);
router.post('/analyticals', authorizeResource('analytical', 'create'), analyticalCreateValidation, createAnalytical);
router.put('/analyticals/:id', authorizeResource('analytical', 'update'), analyticalUpdateValidation, updateAnalytical);
router.delete('/analyticals/:id', authorizeResource('analytical', 'delete'), deleteAnalytical);

router.get('/chart-of-accounts', authorizeResource('coa', 'read'), listCOA);
router.get('/chart-of-accounts/:id', authorizeResource('coa', 'read'), getCOA);
router.post('/chart-of-accounts', authorizeResource('coa', 'create'), coaCreateValidation, createCOA);
router.put('/chart-of-accounts/:id', authorizeResource('coa', 'update'), coaUpdateValidation, updateCOA);
router.delete('/chart-of-accounts/:id', authorizeResource('coa', 'delete'), deleteCOA);

router.get('/journals', authorizeResource('journal', 'read'), listJournals);
router.get('/journals/:id', authorizeResource('journal', 'read'), getJournal);
router.post('/journals', authorizeResource('journal', 'create'), journalCreateValidation, createJournal);
router.put('/journals/:id', authorizeResource('journal', 'update'), journalUpdateValidation, updateJournal);
router.delete('/journals/:id', authorizeResource('journal', 'delete'), deleteJournal);

router.get('/users', authorizeResource('user', 'read'), listUsers);
router.get('/users/:id', authorizeResource('user', 'read'), getUser);
router.post('/users', authorizeResource('user', 'create'), userCreateValidation, createUser);
router.put('/users/:id', authorizeResource('user', 'update'), userUpdateValidation, updateUser);
router.delete('/users/:id', authorizeResource('user', 'delete'), deleteUser);

export default router;