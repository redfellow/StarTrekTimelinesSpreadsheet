import React, { Component } from 'react';
import { Label } from 'office-ui-fabric-react/lib/Label';
import { Link } from 'office-ui-fabric-react/lib/Link';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { DetailsList, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';

import { CollapsibleSection } from './CollapsibleSection.js';
import { RarityStars } from './RarityStars';

import { loginPubNub } from '../utils/chat.js';
import { sortItems, columnClick } from '../utils/listUtils.js';

import STTApi from 'sttapi';

export class MemberList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			members: sortItems(this.props.members, 'display_name'),
			columns: [
				{
					key: 'icon',
					name: '',
					minWidth: 32,
					maxWidth: 32,
					fieldName: 'display_name',
					onRender: (item) => {
						if (item.iconUrl)
							return (<Image src={item.iconUrl} width={32} height={32} imageFit={ImageFit.contain} />);
						else
							return <span />
					}
				},
				{
					key: 'display_name',
					name: 'Name',
					minWidth: 100,
					maxWidth: 180,
					isSorted: true,
					isSortedDescending: false,
					isResizable: true,
					fieldName: 'display_name'
				},
				{
					key: 'rank',
					name: 'Rank',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'rank',
					isPadded: true
				},
				{
					key: 'squad_name',
					name: 'Squad',
					minWidth: 90,
					maxWidth: 150,
					isResizable: true,
					fieldName: 'squad_name',
					isPadded: true,
					onRender: (item) => {
						if (item.squad_name)
							return (<span>{item.squad_name} ({item.squad_rank})</span>);
						else
							return (<span style={{ color: 'red' }}>Not in a squad</span>);
					}
				},
				{
					key: 'last_active',
					name: 'Last active (minutes)',
					minWidth: 70,
					maxWidth: 100,
					isResizable: true,
					fieldName: 'last_active'
				},
				{
					key: 'event_rank',
					name: 'Event rank',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'event_rank'
				},
				{
					key: 'starbase_activity',
					name: 'Starbase activity',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'starbase_activity'
				},
				{
					key: 'daily_activity',
					name: 'Daily activity',
					minWidth: 50,
					maxWidth: 80,
					isResizable: true,
					fieldName: 'daily_activity'
				}
			]
		};

		this._onColumnClick = this._onColumnClick.bind(this);
		this._exportCSV = this._exportCSV.bind(this);
	}

	_onColumnClick(ev, column) {
		this.setState(columnClick(this.state.members, this.state.columns, column));
	}

	_exportCSV() {
		const { dialog } = require('electron').remote;
		const { shell } = require('electron');
		let today = new Date();
		dialog.showSaveDialog(
			{
				filters: [{ name: 'Comma separated file (*.csv)', extensions: ['csv'] }],
				title: 'Export fleet member list',
				defaultPath: STTApi.fleetData.name + '-' + (today.getUTCMonth() + 1) + '-' + (today.getUTCDate())+ '.csv',
				buttonLabel: 'Export'
			},
			function (fileName) {
				if (fileName === undefined)
					return;

				const json2csv = require('json2csv').parse;
				const fs = require('fs');

				var fields = ['display_name', 'rank', 'squad_name', 'squad_rank', 'last_active', 'event_rank', 'starbase_activity', 'daily_activity'];
				var csv = json2csv(this.state.members, { fields: fields });

				fs.writeFile(fileName, csv, function (err) {
					if (!err) {
						shell.openItem(fileName);
					}
				});
			}.bind(this));
	}

	render() {
		return (<CollapsibleSection title={this.props.title}>
			<DetailsList
				items={this.state.members}
				columns={this.state.columns}
				setKey='set'
				selectionMode={SelectionMode.none}
				layoutMode={DetailsListLayoutMode.justified}
				onColumnHeaderClick={this._onColumnClick}
			/>
			<PrimaryButton onClick={this._exportCSV} text='Export member list as CSV...' />
		</CollapsibleSection>);
	}
}

export class Starbase extends React.Component {
	render() {
		return (<CollapsibleSection title={this.props.title}>
			<ul>
				{STTApi.starbaseRooms.map(function (room) {
					return <li key={room.id}>
						<span className='starbase-room'><span className='starbase-room-name'>{room.name}</span><RarityStars min={1} max={room.max_level} value={(room.level > 0) ? room.level : null} /></span>
						{(room.level > 0) &&
							<ul>
								{room.upgrades.slice(0, room.level + 1).map(function (upgrade) {
									return <li key={upgrade.name}>{upgrade.name} {(upgrade.buffs && upgrade.buffs.length > 0) ? (' (' + upgrade.buffs[0].name + ' )') : ''} </li>
								})}
							</ul>}
					</li>
				})}
			</ul>
		</CollapsibleSection>);
	}
}

export class FleetDetails extends React.Component {
	constructor(props) {
		super(props);

		if (STTApi.playerData.fleet && STTApi.playerData.fleet.id != 0) {
			var members = new Array();

			STTApi.fleetMembers.forEach(function (member) {
				var newMember = {
					dbid: member.dbid,
					display_name: member.display_name,
					rank: member.rank,
					last_active: Math.round(member.last_active / 60),
					event_rank: member.event_rank,
					starbase_activity: member.starbase_activity,
					daily_activity: member.daily_activity,
					iconUrl: null,
					crew_avatar: member.crew_avatar
				};

				if (member.squad_id)
				{
					newMember.squad_rank = member.squad_rank;

					var squad = STTApi.fleetSquads.find(function (squad) { return squad.id == member.squad_id; });
					newMember.squad_name = squad.name;
					newMember.squad_event_rank = squad.event_rank;
				}
					
				members.push(newMember);
			});

			this.state = {
				members: members
			};

			let iconPromises = [];
			this.state.members.forEach((member) => {
				if (member.crew_avatar) {
					iconPromises.push(STTApi.imageProvider.getCrewImageUrl(member.crew_avatar, false, member.dbid).then(({id, url}) => {
						this.state.members.forEach(function (member) {
							if (member.dbid === id)
								member.iconUrl = url;
						});

						return Promise.resolve();
					}).catch((error) => { }));
				}
			});
			Promise.all(iconPromises).then(() => this.forceUpdate());

			/*loginPubNub().then(pubnub) => {
				//
			});*/
		}
		else
		{
			this.state = {
				members: null
			};
		}
	}

	render() {
		if (!this.state.members) {
			return <p>It looks like you are not part of a fleet yet!</p>;
		}
		else {
			return <div className='tab-panel' data-is-scrollable='true'>
				<h2>{STTApi.fleetData.name}</h2>
				<h3>{STTApi.fleetData.motd}</h3>

				<MemberList title={'Members (' + STTApi.fleetData.cursize + ' / ' + STTApi.fleetData.maxsize + ')'} members={this.state.members} />

				<Starbase title='Starbase rooms' />
			</div>;
		}
	}
}