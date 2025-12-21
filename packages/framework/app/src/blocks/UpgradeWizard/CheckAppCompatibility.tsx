/**
 * @type: ui
 * name: app.step.CheckAppCompatibility
 * bundle: admincp
 */
import { useGlobal } from '@metafox/framework';
import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useStepNavigate } from '@metafox/ui/steps';
import React from 'react';

export default function Prepare({ description, apps }) {
  const { apiClient } = useGlobal();
  const [next] = useStepNavigate();

  const handleClick = () =>
    apiClient
      .post('/admincp/app/upgrade/disable-apps', {
        apps: apps.map(app => app.identity)
      })
      .then(res => {
        next();
      });

  return (
    <Box>
      <Box sx={{ py: 2 }}>
        <Typography>{description}</Typography>
        {apps.map(app => (
          <Typography key={app.identity}>{app.name}</Typography>
        ))}
      </Box>
      <Box>
        <Button
          variant="contained"
          color="primary"
          size="small"
          data-testid="buttonSubmit"
          onClick={handleClick}
        >
          Disable Apps
        </Button>
      </Box>
    </Box>
  );
}
