import { Router } from 'express';
import { CatalogController } from '../controllers/catalogController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

router.get('/products', CatalogController.getProducts);
router.post('/products', CatalogController.createProduct);
router.put('/products/:id', CatalogController.updateProduct);
router.delete('/products/:id', CatalogController.deleteProduct);

export default router;
