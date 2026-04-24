const assert = require('assert');

function interpolateAgentsByIndex(prevAgents, nextAgents, ratio) {
  return prevAgents.map((prevAgent, index) => {
    const nextAgent = nextAgents[index] || prevAgent;
    return {
      id: prevAgent.id,
      position: {
        x: Number(prevAgent.position.x || 0) + (Number(nextAgent.position.x || 0) - Number(prevAgent.position.x || 0)) * ratio,
        y: Number(prevAgent.position.y || 0) + (Number(nextAgent.position.y || 0) - Number(prevAgent.position.y || 0)) * ratio,
      },
    };
  });
}

function interpolateAgentsById(prevAgents, nextAgents, ratio) {
  const nextById = new Map(nextAgents.map((agent) => [agent.id, agent]));
  return prevAgents.map((prevAgent) => {
    const nextAgent = nextById.get(prevAgent.id) || prevAgent;
    return {
      id: prevAgent.id,
      position: {
        x: Number(prevAgent.position.x || 0) + (Number(nextAgent.position.x || 0) - Number(prevAgent.position.x || 0)) * ratio,
        y: Number(prevAgent.position.y || 0) + (Number(nextAgent.position.y || 0) - Number(prevAgent.position.y || 0)) * ratio,
      },
    };
  });
}

function distance(a, b) {
  const dx = Number(a.x || 0) - Number(b.x || 0);
  const dy = Number(a.y || 0) - Number(b.y || 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function main() {
  const prevAgents = [
    { id: 'bg-1', position: { x: 0, y: 0 } },
    { id: 'bg-2', position: { x: 10, y: 0 } },
  ];
  const nextAgentsReordered = [
    { id: 'bg-2', position: { x: 10.4, y: 0 } },
    { id: 'bg-1', position: { x: 0.4, y: 0 } },
  ];

  const byIndex = interpolateAgentsByIndex(prevAgents, nextAgentsReordered, 0.5);
  const byId = interpolateAgentsById(prevAgents, nextAgentsReordered, 0.5);

  assert(
    distance(byIndex[0].position, prevAgents[0].position) > 4,
    'index-based interpolation should demonstrate the jump when agent order changes'
  );
  assert(
    distance(byId[0].position, prevAgents[0].position) < 1,
    'id-based interpolation should keep the same background agent near its real path'
  );
}

main();
console.log('validate_background_playback_id_alignment: ok');
