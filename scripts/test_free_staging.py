"""Local policy checks; PyYAML is a release-tool dependency, not a runtime package."""
from pathlib import Path
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[1]


class FreeStaging(unittest.TestCase):
    def test_free_service_is_isolated_manual_and_same_origin(self):
        config = yaml.safe_load((ROOT / 'render.free.yaml').read_text())
        self.assertEqual(set(config), {'services'})
        self.assertEqual(len(config['services']), 1)
        service = config['services'][0]
        self.assertEqual(service['plan'], 'free')
        self.assertEqual(service['runtime'], 'node')
        self.assertEqual(service['numInstances'], 1)
        self.assertEqual(service['autoDeployTrigger'], 'off')
        self.assertNotIn('disk', service)
        self.assertNotIn('domains', service)
        self.assertNotIn('preDeployCommand', service)
        paid = yaml.safe_load((ROOT / 'render.yaml').read_text())['services'][0]
        self.assertNotEqual(service['name'], paid['name'])
        for key in ['buildCommand', 'startCommand', 'healthCheckPath']:
            self.assertEqual(service[key], paid[key])
        env = {item['key']: item for item in service['envVars']}
        for key in ['DEMO_MODE', 'STAGING_DEMO', 'SERVE_FRONTEND']:
            self.assertEqual(env[key]['value'], 'true')
        self.assertEqual(env['NODE_ENV']['value'], 'production')
        self.assertEqual(env['REALTIME_ORIGINS'], {'key': 'REALTIME_ORIGINS', 'sync': False})
        self.assertTrue(env['ADMIN_API_TOKEN']['generateValue'])
        self.assertFalse(any(key.startswith('SUPABASE_') for key in env))
        self.assertEqual([key for key in env if key.startswith('VITE_')], ['VITE_API_BASE_URL'])
        self.assertEqual(env['VITE_API_BASE_URL']['value'], '')


if __name__ == '__main__':
    unittest.main()
