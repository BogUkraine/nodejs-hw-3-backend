const {Router} = require('express');
// eslint-disable-next-line new-cap
const router = Router();
const User = require('../models/User');
const Truck = require('../models/Truck');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth.middleware');
const multer = require('multer');
const AWS = require('aws-sdk');

const storage = multer.memoryStorage();
const upload = multer({storage: storage});

const validate = require('../middleware/valid.middleware');
const validProfile = require('../validation/profile.validation');

//* **** GET ******//

/**
 * @api {get} /api/profile/:id get user info
 * @apiName GetProfile
 * @apiGroup profiles
 *
 * @apiHeader {String} authorization User's jwt from local storage.
 *
 * @apiSuccess {Object} user User data.
 *
 * @apiError UserIsntAuthorized User is not authorized.
 * @apiError UserDoesntExist User doesn't exist.
 * @apiError CantGetUser Can not get profile.
 */

router.get('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const jwtId = req.user.userId;
    if (id !== jwtId) {
      return res.status(400).json({message: 'User is not authorized'});
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(500).json({message: 'User does not exist'});
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: 'Can not get profile', error: error,
    });
  }
});

//* **** PUT ******//

/**
 * @api {put} /api/profile/:id/password change user password
 * @apiName PutProfile
 * @apiGroup profiles
 *
 * @apiHeader {String} authorization User's jwt from local storage.
 * @apiParam {String} password new password.
 *
 * @apiSuccess {String} message Profile data was successfully changed.
 *
 * @apiError UserIsntAuthorized User is not authorized.
 * @apiError DriverIsBusy Driver is busy, you can not change any info.
 * @apiError ProfileWasntChanged Profile data wasn't changed.
 */

router.put('/:id/password',
    auth, validate(validProfile.password, 'body'),
    async (req, res) => {
      try {
        const id = req.params.id;
        const jwtId = req.user.userId;
        if (id !== jwtId) {
          return res.status(400).json({message: 'User is not authorized'});
        }

        const isBusy = await Truck.findOne({created_by: id, status: 'OL'});
        if (isBusy) {
          return res.status(500).json({
            message: 'Driver is busy, you can not change any info',
          });
        }

        const password = req.body.password;
        const hashedPassword = await bcrypt.hash(password, 12);

        await User.findByIdAndUpdate(id, {
          $set: {password: hashedPassword},
        });
        return res.status(200).json({
          message: 'Profile data was successfully changed',
        });
      } catch (error) {
        return res.status(500).json({
          message: 'Profile data wasn\'t changed', error: error,
        });
      }
    });

/**
 * @api {put} /api/profile/:id/photo change user photo
 * @apiName PutProfile
 * @apiGroup profiles
 *
 * @apiHeader {String} authorization User's jwt from local storage.
 * @apiParam {Buffer} photo photo.
 *
 * @apiSuccess {String} message Photo was changed.
 *
 * @apiError UserIsntAuthorized User is not authorized.
 * @apiError DriverIsBusy Driver is busy, you can not change any info.
 * @apiError ProfileWasntChanged Profile data wasn't changed.
 */

router.put('/:id/photo',
    auth, upload.single('body'), async (req, res) => {
      try {
        console.log(req.body);
        const id = req.params.id;
        const jwtId = req.user.userId;
        if (id !== jwtId) {
          return res.status(401).json({message: 'User is not authorized'});
        }

        const isBusy = await Truck.findOne({created_by: id, status: 'OL'});
        if (isBusy) {
          return res.status(500).json({
            message: 'Driver is busy, you can not change any info',
          });
        }

        const file = req.body.userPhoto;
        console.log('file is', file);
        const s3FileURL = config.get('AWS_Uploaded_File_URL_LINK');

        const s3bucket = new AWS.S3({
          accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
          region: config.get('AWS_REGION'),
        });

        const params = {
          Bucket: config.get('AWS_BUCKET_NAME'),
          Key: file.originalname,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        };

        s3bucket.upload(params, async (err, data) => {
          if (err) {
            res.status(500).json({error: err});
          } else {
            res.send({data});
            const newFileUploaded = {
              fileLink: s3FileURL + file.originalname,
              s3_key: params.Key,
            };
            await User.findByIdAndUpdate(id, {photo: newFileUploaded});
          }
        });

        return res.status(200).json({message: 'Photo was changed'});
      } catch (error) {
        return res.status(500).json({
          message: 'Profile data wasn\'t changed', error: error,
        });
      }
    });

//* **** POST ******//

//* **** DELETE ******//

/**
 * @api {delete} /api/profile/:id delete user profile
 * @apiName DeleteProfile
 * @apiGroup profiles
 *
 * @apiHeader {String} authorization User's jwt from local storage.
 *
 * @apiSuccess {String} message User was successfully deleted.
 *
 * @apiError UserIsntAuthorized User is not authorized.
 * @apiError ProfileWasntChanged Profile data wasn't deleted.
 */

router.delete('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const jwtId = req.user.userId;
    if (id !== jwtId) {
      return res.status(400).json({message: 'User is not authorized'});
    }

    await User.findByIdAndDelete(id, (err) => {
      if (err) {
        return res.status(500).json({message: 'User wasn\'t deleted', err});
      }
      return res.status(200).json({message: 'User was successfully deleted'});
    });
  } catch (error) {
    return res.status(500).json({
      message: 'User wasn\'t deleted', error: error,
    });
  }
});

module.exports = router;
