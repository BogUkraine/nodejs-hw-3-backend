const {Router} = require('express');
// eslint-disable-next-line new-cap
const router = Router();
const Truck = require('../models/Truck');
const User = require('../models/User');
const auth = require('../middleware/auth.middleware');

const validate = require('../middleware/valid.middleware');
const validTruck = require('../validation/truck.validation');

//* **** POST ******//

router.post('/',
    auth, validate(validTruck.create, 'body'), async (req, res) => {
      try {
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user || user.role !== 'driver') {
          return res.status(500).json({
            message: 'You are not a driver',
          });
        }

        const {type} = req.body;

        switch (type) {
          case('SPRINTER'): {
            const sizes = {
              width: 170,
              height: 250,
              length: 300,
            };
            const weight = 1700;

            const truck = new Truck({
              created_by: userId,
              status: 'IS',
              sizes, 
              weight, 
              type,
            });
            
            await truck.save();
            return res.status(200).json({
              "status": "Truck created successfully",
            });
          }
          case('SMALL STRAIGHT'): {
            const sizes = {
              width: 170,
              height: 250,
              length: 500,
            };
            const weight = 2500;

            const truck = new Truck({
              created_by: userId,
              status: 'IS',
              sizes, 
              weight, 
              type,
            });
            
            await truck.save();
            return res.status(200).json({
              "status": "Truck created successfully",
            });
          }
          case('LARGE STRAIGHT'): {
            const sizes = {
              width: 200,
              height: 350,
              length: 700,
            };
            const weight = 4000;

            const truck = new Truck({
              created_by: userId,
              status: 'IS',
              sizes, 
              weight, 
              type,
            });
            
            await truck.save();
            return res.status(200).json({
              "status": "Truck created successfully",
            });
          }
          default: {
            return res.status(500).json({
              message: 'Truck wasn\'t created',
            });
          }
        }
      } catch (error) {
        return res.status(500).json({
          message: 'Truck wasn\'t created', error: error,
        });
      }
    });

//* **** GET ******//

router.get('/', auth, async (req, res) => {
  try {
    const id = req.user.userId;
    const user = await User.findById(id);
    if (!user || user.role !== 'driver') {
      return res.status(500).json({
        message: 'You are not a driver',
      });
    }

    const trucks = await Truck.find({created_by: id});

    return res.status(200).json({
      "status": "Trucks were got successfully",
      "trucks": trucks,
    });
  } catch (error) {
    return res.status(500).json(
        {message: 'Trucks were not fetched', error: error},
    );
  }
});

//* **** PUT ******//

router.put('/:id/assign', auth, async (req, res) => {
  try {
    const truckId = req.params.id;
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user || user.role !== 'driver') {
      return res.status(500).json({
        message: 'You are not a driver',
      });
    }

    const someTruck = await Truck.findById(truckId);
    const isBusy = await Truck.findOne({
      created_by: someTruck.created_by, status: 'OL',
    });

    if (isBusy) {
      return res.status(500).json({
        message: 'Driver is busy, you can not change any info',
      });
    }

    await Truck.findOneAndUpdate({
      created_by: someTruck.created_by,
      is_assigned: true,
    },
    {is_assigned: false},
    );
    await Truck.findByIdAndUpdate(truckId, {is_assigned: true});

    return res.status(201).json({
      "status": "Truck assigned successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Truck wasn\'t assigned', error: error,
    });
  }
});

router.put('/:id/name',
    auth, validate(validTruck.change, 'body'), async (req, res) => {
      try {
        const truckId = req.params.id;
        const {name} = req.body;

        const someTruck = await Truck.findById(truckId);
        const isBusy = await Truck.findOne({
          created_by: someTruck.created_by, status: 'OL',
        });

        if (isBusy) {
          return res.status(500).json({
            message: 'Driver is busy, you can not change any info',
          });
        }

        await Truck.findByIdAndUpdate(truckId, {name});

        return res.status(201).json({
          message: 'Truck was successfully renamed',
        });
      } catch (error) {
        return res.status(500).json({
          message: 'Truck wasn\'t renamed', error: error,
        });
      }
    });

//* **** DELETE ******//

router.delete('/:id', auth, async (req, res) => {
  try {
    const truckId = req.params.id;
    const someTruck = await Truck.findById(truckId);
    const isBusy = await Truck.findOne({
      created_by: someTruck.created_by, status: 'OL',
    });

    if (isBusy) {
      return res.status(500).json({
        message: 'Driver is busy, you can not change any info',
      });
    }

    await Truck.findOneAndDelete(truckId);

    return res.status(201).json({message: 'Truck was successfully deleted'});
  } catch (error) {
    return res.status(500).json(
        {message: 'Truck wasn\'t deleted', error: error},
    );
  }
});

module.exports = router;
