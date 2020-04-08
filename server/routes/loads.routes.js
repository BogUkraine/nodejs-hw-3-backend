const {Router} = require('express');
// eslint-disable-next-line new-cap
const router = Router();
const auth = require('../middleware/auth.middleware');
const Load = require('../models/Load');
const Truck = require('../models/Truck');
const User = require('../models/User');

const validate = require('../middleware/valid.middleware');
const validLoad = require('../validation/load.validation');

//* **** POST ******//

router.post('/', auth, validate(validLoad.create, 'body'), async (req, res) => {
  try {
    const id = req.user.userId;
    const user = await User.findById(id);
    if(!user || user.role !== 'shipper') {
      return res.status(400).json({message: 'User is not shipper'});
    }

    const form = req.body;

    const load = await Load.create({
      ...form,
      status: 'NEW',
      created_by: id,
      logs: [{
        message: `url: ${req.url},
                  method: ${req.method},
                  host: ${req.host},
                  params: ${req.params},
                  body: ${req.body}`,
        time: Date.now(),
      }],
    });

    if (!load) {
      return res.status(500).json({message: 'Load was not created'});
    }

    load.save();
    return res.status(201).json({"status": "Load created successfully"});
  } catch (error) {
    return res.status(500).json({
      message: 'Load wasn\'t created', error: error,
    });
  }
});

//* **** GET ******//

router.get('/',
    auth, async (req, res) => {
      try {
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (user.role === 'shipper') {
          const loads = await Load.find({created_by: userId});
          return res.status(200).json({
            "status": "Success",
            "loads": loads
          });
        }
        else {
          const loads = await Load.find({assigned_to: userId});
          return res.status(200).json({
            "status": "Success",
            "loads": loads
          });
        }        
      } catch (error) {
        return res.status(500).json({
          message: 'Loads were not fetched', error: error,
        });
      }
    });

//* **** PUT ******//

router.put('/:id/data',
    auth, validate(validLoad.change, 'body'), async (req, res) => {
      try {
        const loadId = req.params.id;

        const item = await Load.findById(loadId);
        if (!item) {
          return res.status(500).json({message: 'Load does not exist'});
        }
        const logs = item.logs;

        await Load.findByIdAndUpdate(
            loadId,
            {
              ...req.body,
              logs: [...logs, {
                message: `url: ${req.url},
                method: ${req.method},
                host: ${req.host},
                params: ${req.params},
                body: ${req.body}`,
                time: Date.now(),
              }],
            },
        );

        return res.status(201).json({message: 'Load was successfully changed'});
      } catch (error) {
        return res.status(500).json({
          message: 'Load was not changed', error: error,
        });
      }
    });

router.patch('/:id/post',
    auth, async (req, res) => {
      try {
        const loadId = req.params.id;

        const load = await Load.findById(loadId);
        if (!load) {
          return res.status(500).json({message: 'Load does not exist'});
        }

        const user = await User.findById(id);
        if(!user || user.role !== 'shipper') {
          return res.status(400).json({message: 'User is not shipper'});
        }

        const fittingTruck = await Truck
            .where('is_assigned').equals(true)
            .where('status').equals('IS')
            .where('weight').gt(load.payload)
            .where('sizes.width').gt(load.dimensions.width)
            .where('sizes.length').gt(load.dimensions.length)
            .where('sizes.height').gt(load.dimensions.height)
            .findOne();

        if (!fittingTruck) {
          return res.status(500).json({
            message: 'There are no fitting trucks at this moment',
          });
        }

        const logs = load.logs;

        await Truck.findByIdAndUpdate(fittingTruck._id, {status: 'OL'});
        await Load.findByIdAndUpdate(loadId,
            {
              assigned_to: fittingTruck.created_by,
              status: 'ASSIGNED',
              state: 'En route to Pick up',
              logs: [...logs, {
                message: `url: ${req.url},
                method: ${req.method},
                host: ${req.host},
                params: ${req.params},
                body: ${req.body}`,
                time: Date.now(),
              }],
            });

        return res.status(201).json({
          "status": "Load posted successfully",
          "assigned_to": fittingTruck.created_by,
        });
      } catch (error) {
        return res.status(500).json({
          message: 'Load was not assigned', error: error,
        });
      }
    });

router.patch('/:id/state', auth, async (req, res) => {
  try {
    const loadId = req.params.id;
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if(!user || user.role !== 'driver') {
      return res.status(500).json({message: 'User is not a driver'});
    }

    const load = await Load.findById(loadId);
    if (!load) {
      return res.status(500).json({message: 'Load doesnt exist'});
    }

    const truck = await Truck.findOne({
      created_by: load.assigned_to, is_assigned: true,
    });
    if (!truck) {
      return res.status(500).json({message: 'Truck was not found'});
    }

    const logs = load.logs;

    switch (load.state) {
      case('en route to pick up'): {
        await Load.findByIdAndUpdate(
          loadId,
          {
            status: 'arrived to pick up',
            logs: [...logs, {
              message: `url: ${req.url},
              method: ${req.method},
              host: ${req.host},
              params: ${req.params},
              body: ${req.body}`,
              time: Date.now(),
            }],
          },
        );

        return res.status(200).json({
          "status": "Load status changed successfully",
        });        
      }
      case('arrived to pick up'): {
        await Load.findByIdAndUpdate(
          loadId,
          {
            status: 'en route to delivery',
            logs: [...logs, {
              message: `url: ${req.url},
              method: ${req.method},
              host: ${req.host},
              params: ${req.params},
              body: ${req.body}`,
              time: Date.now(),
            }],
          },
        );

        return res.status(200).json({
          "status": "Load status changed successfully",
        });
      }
      case('en route to delivery'): {
        await Load.findByIdAndUpdate(
          loadId,
          {
            status: 'Arrived to Delivery',
            state: 'SHIPPED',
            logs: [...logs, {
              message: `url: ${req.url},
              method: ${req.method},
              host: ${req.host},
              params: ${req.params},
              body: ${req.body}`,
              time: Date.now(),
            }],
          },
        );

        await Truck.findByIdAndUpdate(truck._id, {
          status: 'IS',
        });

        return res.status(200).json({
          "status": "Load status changed successfully",
        });
      }
      case('arrived to delivery'): {
        return res.status(200).json({
          "status": "Load status was not changed",
        });
      }
      default: {
        return res.status(200).json({
          "status": "Load status was not changed",
        });
      }
    }
    

  } catch (error) {
    return res.status(500).json({
      message: 'Load was not shipped', error: error,
    });
  }
});

//* **** DELETE ******//

router.delete('/:id',
    auth, async (req, res) => {
      try {
        const loadId = req.params.id;
        const userId = req.user.userId;

        const load = await Load.findById(loadId);

        if (userId !== load.created_by) {
          return res.status(400).json({
            message: 'You dont have permissions',
          });
        }

        if (!load) {
          return res.status(500).json({
            message: 'Load doesnt exist',
          });
        }

        if (load.status === 'ASSIGNED') {
          return res.status(400).json({
            message: 'You cannot delete assigned load',
          });
        }

        await Load.findByIdAndDelete(loadId);

        return res.status(200).json({message: 'Load was successfully deleted'});
      } catch (error) {
        return res.status(500).json({
          message: 'Load was not deleted', error: error,
        });
      }
    });

module.exports = router;
