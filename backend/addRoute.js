const mongoose = require("mongoose");
const Route = require("./models/Route");
const dotenv = require('dotenv').config();
const { MONGO_URI } = process.env; // Mongo URI from environment variables


mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const createRoutes = async () => {
  try {
    const routes = [
      {
        routeName: "City Center to North Side",
        startLocation: "City Center",
        endLocation: "North Side",
        estimatedTime: 30,
        stops: [
          { name: "Main Street", order: 1 },
          { name: "Mall Station", order: 2 },
          { name: "North Side Entrance", order: 3 },
        ],
      },
      {
        routeName: "South Side to University",
        startLocation: "South Side",
        endLocation: "University",
        estimatedTime: 45,
        stops: [
          { name: "South Market", order: 1 },
          { name: "Community Hall", order: 2 },
          { name: "University Gate", order: 3 },
        ],
      },
    ];

    await Route.insertMany(routes);
    console.log("Routes created successfully");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error creating routes:", error.message);
    mongoose.connection.close();
  }
};

createRoutes();
