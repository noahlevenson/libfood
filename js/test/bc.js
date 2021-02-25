const { Happ } = require("../src/happ/happ.js");
const { Hid } = require("../src/hid/hid.js");
const { Hid_pub } = require("../src/hid/hid_pub.js");
const { Hdlt_tsact } = require("../src/hdlt/hdlt_tsact.js");
const { Hdlt_vm } = require("../src/hdlt/hdlt_vm.js");

// The blockchain is just a list of transactions
const bc = [];

// Unspent output database
const utxo_db = new Map();

// The application layer will make sure there is a persistent unspent output in the database with the txid of 0xdead
// which maps to a transaction that will be used as tx_prev when a node creates a new transaction to spend 0xdead
// note that the application layer is responsible for ensuring that a node is allowed to spend 0xdead, so verifiers need to be vigilant here
// The unlock script is just OP_CHECKPOW 20, which allows anyone with a valid 2-bit proof of work to spend it
utxo_db.set("dead", new Hdlt_tsact({utxo: "beef", lock: [null], unlock: [0xFF, 0x02]}))

// Generate an identity 
function makepeer(i = 0) {
	const kp = Happ.generate_key_pair();

	const hid = new Hid_pub({
		pubkey: kp.publicKey.toString("hex"),
		first: `Peer ${i}`,
		last: `McPearson`,
		address: `21 Peer St.`,
		phone: `666-666-6666`,
		lat: 0.0,
		long: 0.0
	});

	Hid.find_partial_preimage(hid, Hid_pub.inc_nonce, 2); // Can we set the leading zero bits this low or does this break something somewhere

	return {
		hid_pub: hid,
		private_key: kp.privateKey
	}
}

// create a transaction for a signing: peer a spends 0xdead on peer b
function dosign(peer_a, peer_b) {
	const nonce_arr = Array.from(Buffer.from(peer_a.hid_pub.nonce, "hex"));
	const pubkey_arr = Array.from(Buffer.from(peer_a.hid_pub.pubkey, "hex"));

	return new Hdlt_tsact({
		utxo: "dead",
		lock: [0x64].concat([nonce_arr.length, ...nonce_arr, 0x64, pubkey_arr.length, ...pubkey_arr]), // push1, len, nonce, push1, len, pubkey
		unlock: [0x64].concat([pubkey_arr.length, ...pubkey_arr, 0xAC]) // push1, len, payee (me) pubkey, checksig
	});
}

const peer_0 = makepeer();
const peer_1 = makepeer(1);

const tx_new = dosign(peer_0, peer_1); // peer 0 signs peer 1

const vm = new Hdlt_vm({tx_prev: utxo_db.get("dead"), tx_new: tx_new});

console.log(vm.exec())