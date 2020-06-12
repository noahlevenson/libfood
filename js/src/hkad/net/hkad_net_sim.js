/** 
* HKAD_NET_SIM
* HKAD net module for a local network simulator
* When used with HAPP's _debug_sim_start(), this net module
* lets you simulate an HKAD network on one local machine
* 
* 
*/ 

"use strict";

const { Hkad_net } = require("./hkad_net.js");
const { Hlog } = require("../../hlog/hlog.js");
const { Hutil } = require("../../hutil/hutil.js");

class Hkad_net_sim extends Hkad_net {
	static peer_list = new Map();

	constructor() {
		super();
	}

	_add_peer(peer) {
		Hkad_net_sim.peer_list.set(peer.node_id.toString(), peer);
	}

	_get_peers() {
		return Array.from(Hkad_net_sim.peer_list.values());
	}

	_debug_dump_network_state() {
		const unique_data_objects = new Map();
		const nodes = Array.from(Hkad_net_sim.peer_list.values());

		let total_data_objects = 0;

		nodes.forEach((node) => {
			const pairs = node.network_data.entries();

			pairs.forEach((pair) => {
				total_data_objects += 1;

				// We look for stale data collisions - occurances where multiple pieces of unique data were stored on the network
				// using the same key -- by idempotently inserting the hash of each data object's data into a map, then comparing
				// the occurances in the map against the total occurances of data associated with the data's key
				unique_data_objects.set(Hutil._sha1(JSON.stringify(pair[1].get_data())), pair[0]);
			});
		});

		const keys_of_unique_data_objects = Array.from(unique_data_objects.values());
		const unique_keys_of_unique_data_objects = [];

		keys_of_unique_data_objects.forEach((key) => {
			if (unique_keys_of_unique_data_objects.indexOf(key) === -1) {
				unique_keys_of_unique_data_objects.push(key);
			}
		});

		let stale = 0;

		unique_keys_of_unique_data_objects.forEach((key) => {
			if (keys_of_unique_data_objects.indexOf(key) !== keys_of_unique_data_objects.lastIndexOf(key)) {
				stale += 1;
			}
		});

		Hlog.log(`********************************************`);
		Hlog.log(`[HKAD] HKAD_NET_SIM _DEBUG_DUMP_NETWORK_STATE:`);
		Hlog.log(`[HKAD] Total peers: ${Hkad_net_sim.peer_list.size}`);
		Hlog.log(`[HKAD] Total data objects: ${total_data_objects} (avg ${(total_data_objects / Hkad_net_sim.peer_list.size).toFixed(1)} data objects per peer)`);
		Hlog.log(`[HKAD] Unique data objects: ${unique_data_objects.size}`);
		Hlog.log(`[HKAD] Stale data key collisions detected: ${stale}\n`);
	}

	_out(msg, node_info) {
		const peer = Hkad_net_sim.peer_list.get(node_info.node_id.toString());

		if (peer) {
			peer.net._in(msg);
		} 
	}
}

module.exports.Hkad_net_sim = Hkad_net_sim;