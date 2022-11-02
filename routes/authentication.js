'use strict';

const { Router } = require('express');

const bcryptjs = require('bcryptjs');
const User = require('./../models/user');

const router = new Router();
const countries = require('./../views/datasets/countries');
const worldServers = require('./../views/datasets/worldservers');

const getCharacter = require('./../lib/load-character');
const lookUpCharacter = getCharacter.lookUpCharacter;
const loadCharacter = getCharacter.loadCharacter;
const loadCharacterFromAPIAndCacheIt =
  getCharacter.loadCharacterFromAPIAndCacheIt;

router.get('/sign-up', (req, res, next) => {
  res.render('sign-up', { countries, worldServers });
});

router.post('/sign-up', (req, res, next) => {
  const { fullName, email, password, inGameName, worldServer, nationality } =
    req.body;
  let characterId;

  lookUpCharacter(inGameName, worldServer)
    .then((user) => {
      characterId = user.externalId;
      return bcryptjs.hash(password, 10);
    })
    .then((hash) => {
      return User.create({
        fullName,
        email,
        inGameName,
        worldServer,
        nationality,
        passwordHashAndSalt: hash,
        characterId: characterId
      });
    })
    .then((user) => {
      req.session.userId = user._id;
      res.redirect('/profile');
    })
    .catch((error) => {
      next(error);
    });
});

router.get('/sign-in', (req, res, next) => {
  res.render('sign-in');
});

router.post('/sign-in', (req, res, next) => {
  let user;
  const { email, password } = req.body;
  User.findOne({ email })
    .then((document) => {
      if (!document) {
        return Promise.reject(new Error("There's no user with that email."));
      } else {
        user = document;
        return bcryptjs.compare(password, user.passwordHashAndSalt);
      }
    })
    .then((result) => {
      if (result) {
        req.session.userId = user._id;
        res.redirect('/private');
      } else {
        return Promise.reject(new Error('Wrong password.'));
      }
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/sign-out', (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
