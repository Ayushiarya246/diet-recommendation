import { sequelize } from "../postgres/postgres.js";
import { createUserModel } from "./User.js";
import { createUserHealthModel } from "./userSchema.js";

const User = createUserModel(sequelize);
const UserHealth = createUserHealthModel(sequelize);

// ✅ Define relationship
User.hasOne(UserHealth, { foreignKey: "userId", onDelete: "CASCADE" });
UserHealth.belongsTo(User, { foreignKey: "userId" });

sequelize.sync()
  .then(() => console.log("✅ PostgreSQL synced ✅"))
  .catch((err) => console.error("❌ Sync Error:", err));


export { User, UserHealth };