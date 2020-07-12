/** 
* HBUY_ITEM_MISC
* An HBUY_ITEM_MISC is a miscellaneous non-menu item
* used for ad hoc purchases or adjustments
* 
* 
* 
*/ 

"use strict";

class Hbuy_item_misc {
	desc;
	price;

	constructor({desc = "", price = 0.00} = {}) {
		// TODO: validation
		this.desc = desc;
		this.price = price;
	}
}

module.exports.Hbuy_item_misc = Hbuy_item_misc;