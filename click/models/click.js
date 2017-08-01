module.exports = function(sequelize, DataTypes) {
	var Click = sequelize.define('clicks', {
		 count: DataTypes.INTEGER
	});

	return Click;
}
