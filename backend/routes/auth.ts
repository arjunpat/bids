import { Router } from 'express';
import * as responses from '../lib/responses';
const router = Router();

import conn from '../lib/Mongo';
const db = conn.db;

import libpn from 'google-libphonenumber';
const phoneUtil = libpn.PhoneNumberUtil.getInstance();

import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { JWT_SECRET, NODE_ENV } from '../lib/config';

/*
USER schema:
{
  first_name: String,
  last_name: String,
  phone: String,
  photo: String,
  loginCode: { // valid for 5 mins
    issued: Number (ms since epoch),
    code: String
  },
  newUser: Boolean, // false if they have logged in, set their name and photo, etc.
}
*/

router.post('/send-code', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.send(responses.error('Missing required field(s)'));

  phone = phoneUtil.parse(phone, 'US');
  if (!phoneUtil.isValidNumberForRegion(phone, 'US'))
    return res.send(responses.error('Invalid phone number'));
  
  phone = phoneUtil.format(phone, libpn.PhoneNumberFormat.E164);

  const loginCode = {
    issued: Date.now(),
    code: Math.floor(Math.random() * 1000000).toString()
  };

  let user = await db.collection('users').findOne({ phone });
  let newUser;
  if (user) {
    newUser = user.newUser;
    await db.collection('users').updateOne({ _id: user._id }, { $set: { loginCode } });
  } else {
    newUser = true;
    await db.collection('users').insertOne({
      phone,
      loginCode,
      newUser: true
    });
  }

  // send login code
  const message = `Whitelisted: Your login code is ${loginCode.code}.`;
  const body = {
    To: phone,
    MessagingServiceSid: process.env.TWILIO_SERVICE_SID,
    Body: message
  };
  const auth = `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
  let resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
    },
    body: Object.keys(body).map(key => `${key}=${encodeURIComponent(body[key])}`).join('&')
  }).then(res => res.json());

  if (resp.status !== 'accepted') {
    return res.status(500).send(responses.error('Error messaging'));
  }

  res.send(responses.success({ newUser }));
});

const MAX_LOGIN_CODE_AGE = 5 * 60 * 1000;
router.post('/login', async (req, res) => {
  const { phone: rawPhone, code } = req.body;
  if (!rawPhone || !code) return res.send(responses.error('Missing required field(s)'));

  const phone = phoneUtil.format(phoneUtil.parse(rawPhone, 'US'), libpn.PhoneNumberFormat.E164);

  let user = await db.collection('users').findOne({ phone });
  if (!user) return res.send(responses.error('Invalid phone number'));
  if (!user.loginCode) return res.send(responses.error('No login code sent'));

  if (user.loginCode.issued + MAX_LOGIN_CODE_AGE < Date.now())
    return res.send(responses.error('Login code expired'));

  if (user.loginCode.code !== code)
    return res.send(responses.error('Invalid login code'));
  
  await db.collection('users').updateOne({ _id: user._id }, {
    $unset: { loginCode: '' }
  });

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7 days' });
  res.cookie('list_', token, {
    maxAge: 7 * 60 * 60 * 1000, // 3 days
    sameSite: NODE_ENV === 'production' ? 'none' : undefined,
    secure: NODE_ENV === 'production' ? true : undefined,
  });

  res.send(responses.success());
});

export default router;