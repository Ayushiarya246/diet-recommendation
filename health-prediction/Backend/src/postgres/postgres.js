import { Sequelize } from "sequelize";

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: 'localhost',
  dialect:'postgres'
});

const connection=async()=>{
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        await sequelize.sync({ alter: true });
        console.log("✅ All models synced.");
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

export { sequelize };
export default connection;