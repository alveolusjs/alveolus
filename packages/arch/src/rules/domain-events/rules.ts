import { Node } from "ts-morph";
import type { ClassDeclaration } from "ts-morph";

import type { Violation } from "../../building-blocks/index.ts";
import { violation } from "../../building-blocks/index.ts";

const irregularPastForms = new Set([
	"ate",
	"beaten",
	"became",
	"become",
	"began",
	"begun",
	"bent",
	"bet",
	"bid",
	"bitten",
	"bled",
	"blew",
	"blown",
	"bought",
	"bound",
	"broadcast",
	"broke",
	"broken",
	"brought",
	"built",
	"burnt",
	"came",
	"cast",
	"caught",
	"chose",
	"chosen",
	"come",
	"cost",
	"crept",
	"cut",
	"dealt",
	"done",
	"drawn",
	"drew",
	"driven",
	"drove",
	"dug",
	"eaten",
	"fallen",
	"fed",
	"fell",
	"felt",
	"fled",
	"flew",
	"flown",
	"forbidden",
	"forecast",
	"forgave",
	"forgiven",
	"forgot",
	"forgotten",
	"fought",
	"found",
	"froze",
	"frozen",
	"gave",
	"given",
	"gone",
	"got",
	"gotten",
	"grew",
	"ground",
	"grown",
	"held",
	"hid",
	"hidden",
	"hit",
	"hung",
	"hurt",
	"kept",
	"knew",
	"known",
	"laid",
	"leapt",
	"learnt",
	"led",
	"left",
	"lent",
	"let",
	"lost",
	"made",
	"meant",
	"met",
	"mistaken",
	"overridden",
	"overtaken",
	"paid",
	"proven",
	"put",
	"quit",
	"ran",
	"rang",
	"read",
	"rebuilt",
	"remade",
	"rerun",
	"reset",
	"resold",
	"retaken",
	"rewritten",
	"rode",
	"rose",
	"risen",
	"run",
	"said",
	"sang",
	"sat",
	"saw",
	"seen",
	"sent",
	"set",
	"shaken",
	"shed",
	"shone",
	"shot",
	"shown",
	"shut",
	"slept",
	"sold",
	"sought",
	"sped",
	"spent",
	"split",
	"spoke",
	"spoken",
	"spread",
	"spun",
	"stood",
	"stole",
	"stolen",
	"struck",
	"stuck",
	"swept",
	"swore",
	"sworn",
	"taken",
	"taught",
	"thought",
	"threw",
	"thrown",
	"told",
	"took",
	"tore",
	"torn",
	"undone",
	"understood",
	"undertaken",
	"upset",
	"withdrawn",
	"withdrew",
	"woke",
	"woken",
	"won",
	"wore",
	"worn",
	"wound",
	"wrote",
	"written",
]);

const notPastForms = new Set([
	"bed",
	"breed",
	"deed",
	"embed",
	"feed",
	"greed",
	"hundred",
	"need",
	"red",
	"seed",
	"speed",
	"weed",
]);

export function isPastTense(name: string): boolean {
	const word = name.match(/[A-Z]?[a-z]+$/)?.[0].toLowerCase();
	if (word === undefined || notPastForms.has(word)) {
		return false;
	}
	return word.endsWith("ed") || irregularPastForms.has(word);
}

function pastTense(event: ClassDeclaration): Violation[] {
	const name = event.getName();
	if (name === undefined || isPastTense(name)) {
		return [];
	}
	return [
		violation(
			event.getNameNode() ?? event,
			"domain-event/past-tense",
			`${name} is not named in the past tense; name the event after what happened, such as OrderPlaced.`,
		),
	];
}

function noStaticMembers(event: ClassDeclaration): Violation[] {
	const name = event.getName();
	return event
		.getStaticMembers()
		.map((member) =>
			violation(
				member,
				"domain-event/no-static-members",
				Node.isClassStaticBlockDeclaration(member)
					? `${name} has a static block; domain events have no static members.`
					: `${name}.${member.getName()} is static; domain events have no static members.`,
			),
		);
}

export function checkDomainEvents(events: readonly ClassDeclaration[]): Violation[] {
	return events.flatMap((event) => [...pastTense(event), ...noStaticMembers(event)]);
}
