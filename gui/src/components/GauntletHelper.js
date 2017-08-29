import React, { Component } from 'react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

import { CrewList } from './CrewList.js';

import { computeGauntlet } from '../utils/gauntlet.js';

export class GauntletHelper extends React.Component {
	constructor(props) {
		super(props);

		if (props.gauntlet.state != 'NONE') {
			this.state = {
				alreadyStarted: true
			};
		}
		else {
			var result = computeGauntlet(props.gauntlet, props.crew);

			this.state = {
				alreadyStarted: false,
				startsIn: Math.floor(props.gauntlet.seconds_to_join / 60),
				featuredSkill: props.gauntlet.contest_data.featured_skill,
				traits: props.gauntlet.contest_data.traits,
				recommendations: result.recommendations.map(function (id) { return props.crew.find((crew) => (crew.id == id)); }),
				bestInSkill: result.best
			};
		}
	}

	render() {
		if (this.state.alreadyStarted) {
			return (<MessageBar messageBarType={MessageBarType.error} >It looks like you already started this gauntlet. Try to use this option before joining your next gauntlet!</MessageBar>);
		}
		else {
			return (
				<div>
					<Label>Next gauntlet starts in {this.state.startsIn} minutes.</Label>
					<Label>Featured skill: {this.state.featuredSkill}</Label>
					<Label>Featured traits: {this.state.traits.join(', ')}</Label>
					<h2>Recommeded crew selection:</h2>
					<CrewList data={this.state.recommendations} ref='recommendedCrew' />
				</div>
			);
		}
	}

	componentDidMount() {
		this.refs.recommendedCrew.setGroupedColumn('');
	}
}