const router = require('express').Router();
const github = require('../controllers/githubController');

router.get('/github', github.redirect);
router.get('/github/callback', github.callback);

module.exports = router;
