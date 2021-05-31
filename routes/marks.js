const express = require('express');
const router = express.Router();
const db = require('../models/index');
const { Op } = require('sequelize');
const MarkdownIt = require('markdown-it');
const markdown = new MarkdownIt();


const pNum = 10;

//ログインチェックの関数
function check(req, res) {
  if (req.session.login == null) {
    req.session.back = '/md';
    res.redirect('/users/login');
    return true;
  } else {
    return false;
  }
}

// トップページへのアクセス
router.get('/', (req, res, next) => {
  if (check(req, res, next)) { return };
  db.Markdata.findAll({
    where: { userId: req.session.login.id },
    limit: pNum,
    order: [
      ['createdAt', 'DESC']
    ]
  }).then(mds => {
    var data = {
      title: 'Markdown Search',
      login: req.session.login,
      message: '※最近の投稿データ',
      form: { find: '' },
      content: mds,
    }
    res.render('md/index', data);
  })
});

//検索フォームの送信処理
router.post('/', (req, res, next) => {
  if (check(req, res, next)) { return };
  db.Markdata.findAll({
    where: {
      userId: req.session.login.id,
      content: { [ Op.like ]: '%' + req.body.find + '%' },
    },
    order: [
      ['createdAt', 'DESC']
    ]
  }).then(mds => {
    var data = {
      title: 'Markdown Search',
      login: req.session.login,
      message: '※"' + req.body.find + '"で検索された最近の投稿データ',
      form: req.body,
      content: mds,
    }
    res.render('md/index', data);
  })
});

//新規作成ページ
router.get('/add', (req, res, next) => {
  if (check(req, res, next)) { return };
  res.render('md/add', { title: 'Markdown/Add' });
});

//新規作成フォームの送信処理
router.post('/add', (req, res, next) => {
  if (check(req, res, next)) { return };
  db.sequelize.sync().then(() => db.Markdata.create({
      userId: req.session.login.id,
      title: req.body.title,
      content: req.body.content,
    })
      .then(model => {
        res.redirect('/md');
      })
    );
});

//'/mark'へのアクセスしたさいのリダイレクト
router.get('/mark', (req, res, next) => {
  res.redirect('/md');
  return;
});

//指定IDのMarkdata表示
router.get('/mark/:id', (req, res, next) => {
  if (check(req, res)) { return };
  db.Markdata.findOne({
    where: {
      id: req.params.id,
      userId: req.session.login.id
    },
  })
    .then((model) => {
      makePage(req, res, model, true);
    })
});

//Markdataの更新処理
router.post('/mark/:id', (req, res, next) => {
  if (check(req, res)) { return };
  db.Markdata.findByPk(req.params.id)
    .then(md => {
      md.content = req.body.source;
      md.save().then((model) => {
        makePage(req, res, model, false);
      });
    })
});

//指定IDのMarkdataの表示ページを作成
function makePage(req, res, model, flg) {
  var footer;
  if (flg) {
    var d1 = new Date(model.createdAt);
    var dString1 = d1.getFullYear() + '-' + (d1.getMonth() + 1) + '-' + d1.getDate();
    var d2 = new Date(model.updatedAt);
    var dString2 = d2.getFullYear() + '-' + (d2.getMonth() + 1) + '-' + d2.getDate();
    footer = '(created: ' + dString1 + 'updated: ' + dString2 + ')';
  } else {
    footer = '(Updating date and time information...)';
  }
  var data = {
    title: 'Markdown',
    id: req.params.id,
    head: model.title,
    footer: footer,
    content: markdown.render(model.content),
    source: model.content
  };
  res.render('md/mark', data);
}

module.exports = router;