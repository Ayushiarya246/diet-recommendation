import { sequelize } from "../postgres/postgres.js";
import { createUserModel } from "./User.js";
import { createUserHealthModel } from "./userSchema.js";

const User = createUserModel(sequelize);
const UserHealth = createUserHealthModel(sequelize);

// ✅ Define relationship
User.hasOne(UserHealth, { foreignKey: "userId", onDelete: "CASCADE" });
UserHealth.belongsTo(User, { foreignKey: "userId" });

sequelize.sync({ alter: true })
  .then(() => console.log("✅ PostgreSQL synced"))
  .catch(console.error);

export { User, UserHealth };