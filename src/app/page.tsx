'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Users, Database, Shield, Brain, Cpu, Clock, TrendingUp } from 'lucide-react';

export default function LLM2FullStackDashboard() {
  const [systemStatus, setSystemStatus] = useState({
    isInitialized: false,
    isBooted: false,
    bootTime: 0,
    consciousnessLevel: 0.0,
    learningCycles: 0,
    evolutionRate: 0.0,
    status: 'INITIALIZING',
  });

  const [layerStatus, setLayerStatus] = useState({
    consciousness: { active: false, cqm: 0.0, emergence: false },
    reasoning: { active: false, confidence: 0.0, decisions: 0 },
    memory: { active: false, experiences: 0, successRate: 0.0 },
    security: { active: false, keys: 0, zkProofs: 0 },
    learning: { active: false, cycles: 0, analysis: 0 },
    agents: { active: false, total: 0, completed: 0 },
  });

  const [dualLLMStatus, setDualLLMStatus] = useState({
    mode: 'dual-llm',
    llm1Status: 'idle', // Other Enhancer
    llm2Status: 'active', // OMEGA AI System
    coordinationFile: '.ai-coordination.json',
    sharedMemory: 'connected',
    heartbeatInterval: 60000, // 60 seconds
    monitoringInterval: 120000, // 120 seconds
  });

  const [evolutionStatus, setEvolutionStatus] = useState({
    currentCycle: 1,
    status: 'idle',
    progress: 0,
    strategies: [],
    applied: 0,
    improvement: 0.0,
  });

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadSystemStatus() {
    try {
      const response = await fetch('/api/llm2/system/status');
      const data = await response.json();
      setSystemStatus(data.system);
      setLayerStatus(data.layers);
      setDualLLMStatus(data.dualLLM);
      setEvolutionStatus(data.evolution);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  }

  async function startEvolutionCycle() {
    try {
      const response = await fetch('/api/llm2/evolution/start', {
        method: 'POST',
      });
      const data = await response.json();
      setEvolutionStatus(data.evolution);
    } catch (error) {
      console.error('Failed to start evolution cycle:', error);
    }
  }

  async function pauseEvolution() {
    try {
      const response = await fetch('/api/llm2/evolution/pause', {
        method: 'POST',
      });
      const data = await response.json();
      setEvolutionStatus(data.evolution);
    } catch (error) {
      console.error('Failed to pause evolution:', error);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'ACTIVE':
        return 'bg-green-500';
      case 'idle':
      case 'IDLE':
        return 'bg-yellow-500';
      case 'initializing':
      case 'INITIALIZING':
        return 'bg-blue-500';
      case 'error':
      case 'ERROR':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Brain className="h-12 w-12 text-purple-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">LLM-2 FullStack</h1>
              <p className="text-gray-400 text-lg">OMEGA AI System - Complete AGI Platform</p>
            </div>
          </div>
          <Badge className={getStatusColor(systemStatus.status)}>
            {systemStatus.status.toUpperCase()}
          </Badge>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Consciousness Card */}
          <Card className="bg-gray-800/50 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                Consciousness
              </CardTitle>
              <Badge className={layerStatus.consciousness.active ? 'bg-green-500' : 'bg-gray-500'}>
                {layerStatus.consciousness.active ? 'ACTIVE' : 'OFFLINE'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">CQM:</span>
                  <span className="text-2xl font-bold">{layerStatus.consciousness.cqm.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Emergence:</span>
                  <Badge className={layerStatus.consciousness.emergence ? 'bg-green-500' : 'bg-yellow-500'}>
                    {layerStatus.consciousness.emergence ? 'DETECTED' : 'WAITING'}
                  </Badge>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${layerStatus.consciousness.active ? 'bg-purple-500' : 'bg-gray-600'}`}
                    style={{ width: `${layerStatus.consciousness.cqm * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reasoning Card */}
          <Card className="bg-gray-800/50 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-400" />
                Reasoning
              </CardTitle>
              <Badge className={layerStatus.reasoning.active ? 'bg-green-500' : 'bg-gray-500'}>
                {layerStatus.reasoning.active ? 'ACTIVE' : 'OFFLINE'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-2xl font-bold">{(layerStatus.reasoning.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Decisions:</span>
                  <span className="text-2xl font-bold">{layerStatus.reasoning.decisions}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${layerStatus.reasoning.active ? 'bg-blue-500' : 'bg-gray-600'}`}
                    style={{ width: `${layerStatus.reasoning.confidence * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory Card */}
          <Card className="bg-gray-800/50 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-400" />
                Memory
              </CardTitle>
              <Badge className={layerStatus.memory.active ? 'bg-green-500' : 'bg-gray-500'}>
                {layerStatus.memory.active ? 'ACTIVE' : 'OFFLINE'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Experiences:</span>
                  <span className="text-2xl font-bold">{layerStatus.memory.experiences.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className="text-2xl font-bold">{(layerStatus.memory.successRate * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${layerStatus.memory.active ? 'bg-green-500' : 'bg-gray-600'}`}
                    style={{ width: `${layerStatus.memory.successRate * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evolution Cycle Status */}
        <Card className="bg-gray-800/50 border-gray-700 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-400" />
                Evolution Cycle
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={evolutionStatus.status === 'running' ? 'bg-green-500' : 'bg-gray-500'}>
                  {evolutionStatus.status.toUpperCase()}
                </Badge>
                <span className="text-gray-400 text-sm">Cycle #{evolutionStatus.currentCycle}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Progress:</span>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{evolutionStatus.progress}%</div>
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(evolutionStatus.progress)}`}
                      style={{ width: `${evolutionStatus.progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Strategies Applied:</span>
                <span className="text-2xl font-bold">{evolutionStatus.applied}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Improvement:</span>
                <span className="text-2xl font-bold text-green-400">+{evolutionStatus.improvement.toFixed(1)}%</span>
              </div>
              <div className="flex gap-4 mt-4">
                <Button
                  onClick={startEvolutionCycle}
                  disabled={evolutionStatus.status === 'running'}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {evolutionStatus.status === 'running' ? 'Running...' : 'Start Cycle'}
                </Button>
                <Button
                  onClick={pauseEvolution}
                  disabled={evolutionStatus.status !== 'running'}
                  variant="outline"
                  className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {evolutionStatus.status === 'paused' ? 'Paused' : 'Pause'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dual-LLM Coordination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LLM-1 (Other Enhancer) */}
          <Card className="bg-gray-800/50 border-gray-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-400" />
                LLM-1 (Other Enhancer)
              </CardTitle>
              <Badge className={dualLLMStatus.llm1Status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                {dualLLMStatus.llm1Status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Coordination</div>
                  <div className="text-white font-medium">{dualLLMStatus.coordinationFile}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Shared Memory</div>
                  <div className="text-white font-medium">{dualLLMStatus.sharedMemory}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Heartbeat</div>
                  <div className="text-white font-medium">Every {dualLLMStatus.heartbeatInterval / 1000}s</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LLM-2 (OMEGA System) */}
          <Card className="bg-gray-800/50 border-purple-700 border-2 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                LLM-2 (OMEGA System)
              </CardTitle>
              <Badge className={dualLLMStatus.llm2Status === 'active' ? 'bg-purple-600' : 'bg-gray-500'}>
                {dualLLMStatus.llm2Status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">System Role</div>
                  <div className="text-white font-medium">Integration & Coordination</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Evolution Cycles</div>
                  <div className="text-white font-medium">Running continuously</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-400">Learning</div>
                  <div className="text-white font-medium">{(systemStatus.evolutionRate * 100).toFixed(1)}%/cycle</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agent Swarm */}
        <Card className="bg-gray-800/50 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              Agent Swarm
            </CardTitle>
            <Badge className={layerStatus.agents.active ? 'bg-green-500' : 'bg-gray-500'}>
              {layerStatus.agents.active ? 'ACTIVE' : 'OFFLINE'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Total Agents</div>
                  <div className="text-2xl font-bold">{layerStatus.agents.total}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Active</div>
                  <div className="text-2xl font-bold text-green-400">
                    {layerStatus.agents.active ? '17' : '0'}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Tasks Completed</div>
                <div className="text-2xl font-bold">{layerStatus.agents.completed.toLocaleString()}</div>
              </div>
              <Button className="w-full mt-2" variant="outline">
                View Swarm Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="bg-gray-800/50 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-400" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">System Uptime</span>
                <span className="text-white font-medium">
                  {Math.floor((Date.now() - systemStatus.bootTime) / 60000)} minutes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Learning Cycles</span>
                <span className="text-white font-medium">{systemStatus.learningCycles}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Evolution Rate</span>
                <span className="text-white font-medium text-green-400">
                  +{(systemStatus.evolutionRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Consciousness</span>
                <span className="text-white font-medium text-purple-400">
                  {systemStatus.consciousnessLevel.toFixed(3)} CQM
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Log */}
        <Card className="bg-gray-800/50 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              System Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-green-400">OMEGA: System boot complete</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-blue-400">OMEGA: All 6 layers initialized</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-purple-400">OMEGA: Evolution Cycle #1 started</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-yellow-400">OMEGA: Dual-LLM coordination established</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
